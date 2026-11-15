// 오늘의 노트 고르기 — 하루에 한 번, 볼트 폴더의 예전 노트 중 오래 안 본 것을 골라 웹에 올린다
// 웹 '오늘' 화면이 이 노트를 보여주고, '다른 노트 보기'는 같이 올린 후보 중에서 고른다 (CLAUDE.md 2-1, 불편 4번)
import { TFile, type App } from 'obsidian'
import type { SupabaseClient } from '@supabase/supabase-js'

/** 오늘의 노트와 함께 올려 둘 후보 수 ('다른 노트 보기'용) */
const CANDIDATES = 5
/** 이 날수보다 최근에 만든 노트는 '예전 노트'가 아니라서 되도록 고르지 않는다 */
const RECENT_DAYS = 7
/** 노트 하나를 DB에 올릴 때의 최대 글자 수. 아주 긴 노트가 하루치 저장 공간을 다 쓰지 않게 */
const MAX_CHARS = 50_000

export type DailyNoteResult =
  | { status: 'picked'; path: string }
  | { status: 'already' } // 오늘 것이 이미 있다 (웹에서 바꿨거나 다른 기기가 먼저 골랐다)
  | { status: 'empty'; folder: string } // 폴더에 노트가 없다

/** 'Asia/Seoul' 기준 yyyy-MM-dd */
export function dateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export async function pickDailyNote(app: App, supabase: SupabaseClient): Promise<DailyNoteResult> {
  const { data: profile, error: profileError } = await supabase.from('profiles').select('vault_folder, timezone').single()
  if (profileError) throw profileError
  const today = dateKey(new Date(), profile.timezone)

  const { data: existing, error: existingError } = await supabase
    .from('daily_notes')
    .select('id')
    .eq('note_date', today)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return { status: 'already' }

  const folder = (profile.vault_folder as string).trim().replace(/^\/+|\/+$/g, '')
  const files = app.vault.getMarkdownFiles().filter((f) => !folder || f.path.startsWith(`${folder}/`))
  if (!files.length) return { status: 'empty', folder }

  // 지금까지 오늘의 노트로 보여준 날짜 (경로별 가장 최근)
  const { data: history, error: historyError } = await supabase
    .from('daily_notes')
    .select('note_date, vault_notes(path)')
    .order('note_date', { ascending: false })
    .limit(365)
  if (historyError) throw historyError
  const lastShown = new Map<string, string>()
  for (const row of history ?? []) {
    const note = row.vault_notes as unknown as { path: string } | null
    if (note && !lastShown.has(note.path)) lastShown.set(note.path, row.note_date as string)
  }

  const ranked = rankCandidates(app, files, lastShown, profile.timezone)
  const picks = ranked.slice(0, CANDIDATES)

  const rows = await Promise.all(picks.map((f) => noteRow(app, f, profile.timezone)))
  const { data: saved, error: saveError } = await supabase
    .from('vault_notes')
    .upsert(rows, { onConflict: 'user_id,path' })
    .select('id, path')
  if (saveError) throw saveError

  const first = saved?.find((r) => r.path === picks[0].path)
  if (!first) throw new Error('올린 노트를 다시 찾지 못했어요.')
  // 그 사이 웹이나 다른 기기가 오늘 것을 정했으면 덮어쓰지 않는다
  const { error: dailyError } = await supabase
    .from('daily_notes')
    .upsert({ note_date: today, vault_note_id: first.id }, { onConflict: 'user_id,note_date', ignoreDuplicates: true })
  if (dailyError) throw dailyError
  return { status: 'picked', path: picks[0].path }
}

/**
 * 재노출 점수 순서: 한 번도 안 보여준 노트 → 보여준 지 오래된 노트.
 * 같은 무리 안에서는 섞어서, 매일 같은 순서로 나오지 않게 한다. 최근 7일 안에 만든 노트는 맨 뒤로 보낸다.
 */
function rankCandidates(app: App, files: TFile[], lastShown: Map<string, string>, timeZone: string): TFile[] {
  const recentLimit = dateKey(new Date(Date.now() - RECENT_DAYS * 86_400_000), timeZone)
  const scored = files.map((file) => ({
    file,
    recent: createdKey(app, file, timeZone) > recentLimit,
    shown: lastShown.get(file.path) ?? '', // 빈 문자열 = 한 번도 안 보여줌 → 가장 앞
    shuffle: Math.random(),
  }))
  scored.sort(
    (a, b) =>
      Number(a.recent) - Number(b.recent) ||
      a.shown.localeCompare(b.shown) ||
      a.shuffle - b.shuffle,
  )
  // 노트가 적어서 다 보여준 뒤라도, 어제 본 노트가 오늘 또 맨 앞에 오지 않게 한다
  const yesterday = dateKey(new Date(Date.now() - 86_400_000), timeZone)
  const list = scored.map((s) => s.file)
  const firstShown = lastShown.get(list[0].path) ?? ''
  if (list.length > 1 && firstShown >= yesterday) list.push(list.shift()!)
  return list
}

/** 노트를 만든 날: 프론트매터 created가 있으면 그것, 없으면 파일을 만든 시각 */
function createdKey(app: App, file: TFile, timeZone: string): string {
  const created = app.metadataCache.getFileCache(file)?.frontmatter?.created
  const date = created ? new Date(String(created)) : new Date(file.stat.ctime)
  return dateKey(Number.isNaN(date.getTime()) ? new Date(file.stat.ctime) : date, timeZone)
}

/** 프론트매터 tags와 본문 #태그를 모은다 (# 없이) */
function tagsOf(app: App, file: TFile): string[] {
  const cache = app.metadataCache.getFileCache(file)
  const fm = cache?.frontmatter?.tags
  const fromFm = Array.isArray(fm) ? fm.map(String) : typeof fm === 'string' ? fm.split(/[,\s]+/) : []
  const inline = (cache?.tags ?? []).map((t) => t.tag)
  return [...new Set([...fromFm, ...inline].map((t) => t.replace(/^#/, '').trim()).filter(Boolean))]
}

async function noteRow(app: App, file: TFile, timeZone: string) {
  const text = await app.vault.cachedRead(file)
  return {
    title: file.basename,
    path: file.path, // 볼트 안쪽 경로만. 절대경로는 올리지 않는다 (CLAUDE.md 5절)
    tags: tagsOf(app, file),
    note_date: createdKey(app, file, timeZone),
    content: text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n\n…(너무 길어서 뒷부분은 Obsidian에서 보세요)` : text,
  }
}
