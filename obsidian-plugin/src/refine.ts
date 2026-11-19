// AI 정제 — '정제대기' 메모를 잠그고 Claude Code(없으면 Gemini)로 다듬은 뒤, 플러그인이 볼트에 노트를 만들고 결과를 DB에 되돌려 적는다
// 단계별 설명은 docs/architecture.md 2-2절에 있다
import { TFile, type App } from 'obsidian'
import type { SupabaseClient } from '@supabase/supabase-js'
import { claimMemo, errorText, pendingFilter, type ClaimableMemo } from './claim'
import { runClaude } from './claudeCode'
import { ensureFolder } from './fetchMemos'
import { dropMissingLinks, GeminiBusyError, refineWithGemini } from './gemini'
import { noteBody, notePath } from './noteFile'
import { refineMessage } from './refinePrompt'

type MemoRow = ClaimableMemo & {
  content: string
  tags: string[]
  target_folder: string
  created_at: string
}

export type RefineResult = {
  created: string[] // 만든 노트 경로
  failed: string[] // 실패한 메모 번호와 이유
  claudeMissing: boolean // Claude Code도 Gemini 키도 없어서 메모를 그대로 두었다
  engine?: Engine // 이번에 정제에 쓴 것
  busy?: string // Gemini 사용량 초과 등으로 메모를 정제대기로 돌려놓은 이유
}

export type Engine = 'Claude Code' | 'Gemini'

type RefineOptions = {
  deviceName: string
  vaultPath: string
  findClaude: () => Promise<string | null>
  /** 사용자가 설정에 넣은 Gemini 무료 키. Claude Code가 없을 때 쓴다 */
  geminiKey?: string
  /** Claude Code가 있어도 Gemini를 쓴다 */
  preferGemini?: boolean
  /** 플러그인이 꺼지는 중이면 true */
  stopped: () => boolean
}

/** 파일 이름과 위키링크에 쓸 수 없는 글자를 뺀다 */
const cleanTitle = (title: string) => title.replace(/[\\/:*?"<>|#^[\]]/g, ' ').replace(/^\.+/, '').replace(/\s+/g, ' ').trim()

function parseNote(result: string): { title: string; body: string } {
  const note = result.match(/^TITLE:\s*(.+?)\s*\n+---NOTE---\n([\s\S]+)/m)
  if (note) return { title: note[1], body: note[2].trim() }
  const error = result.match(/^NOTE_ERROR:\s*(.+)$/m)
  throw new Error(error ? `노트를 만들지 못했어요: ${error[1]}` : 'AI의 답이 약속한 형식이 아니에요.')
}

/** 지난번에 노트를 만들고 DB에 적기 직전에 멈췄으면 그 노트가 있다. 이름이 제목이라 번호로 찾는다 (위험 2) */
function findNoteOfMemo(app: App, memoId: number): TFile | undefined {
  return app.vault.getMarkdownFiles().find((file) => app.metadataCache.getFileCache(file)?.frontmatter?.memo_id === memoId)
}

/** 같은 제목의 다른 노트를 덮어쓰지 않도록 메모 번호를 붙여 피한다 */
function freeNotePath(app: App, folder: string, title: string, memoId: number): string {
  const path = notePath(folder, `${title}.md`)
  return app.vault.getAbstractFileByPath(path) ? notePath(folder, `${title} (메모 ${memoId}).md`) : path
}

export async function refinePendingMemos(app: App, supabase: SupabaseClient, opts: RefineOptions): Promise<RefineResult> {
  const result: RefineResult = { created: [], failed: [], claudeMissing: false }
  const { data: memos, error } = await supabase
    .from('memos')
    .select('id, content, tags, target_folder, status, claimed_at, retry_count, created_at')
    .eq('save_mode', '정제')
    .or(pendingFilter('정제대기'))
    .order('created_at')
  if (error) throw error
  if (!memos.length) return result

  // Claude Code가 있으면 그것을, 없으면 Gemini 키를 쓴다. 둘 다 없으면 잠그지 않고 그대로 둔다. 나중에 설치하거나 키를 넣으면 이어서 처리된다
  const geminiKey = opts.geminiKey?.trim()
  const claudePath = opts.preferGemini && geminiKey ? null : await opts.findClaude()
  let ask: (content: string) => Promise<string>
  if (claudePath) {
    ask = (content) => runClaude(claudePath, opts.vaultPath, refineMessage(content))
    result.engine = 'Claude Code'
  } else if (geminiKey) {
    ask = (content) => refineWithGemini(app, geminiKey, content)
    result.engine = 'Gemini'
  } else return { ...result, claudeMissing: true }

  for (const memo of memos as MemoRow[]) {
    if (opts.stopped()) break
    const claim = await claimMemo(supabase, memo, opts.deviceName)
    if (claim === '포기') result.failed.push(`메모 ${memo.id}: 재시도 한도 초과`)
    if (claim !== '잠금') continue

    try {
      const existing = memo.status === '처리중' ? findNoteOfMemo(app, memo.id) : undefined
      const path = existing?.path ?? (await createNote(app, memo, ask, result.engine === 'Gemini'))
      const { error: doneError } = await supabase
        .from('memos')
        .update({ status: '완료', note_path: path, error_message: null })
        .eq('id', memo.id)
      if (doneError) throw doneError
      result.created.push(path)
    } catch (e) {
      // 꺼지는 중에 멈춘 것은 실패가 아니다. '처리중'으로 남겨 두면 10분 뒤 다시 집어 간다
      if (opts.stopped()) break
      // 기다리면 풀리는 문제는 실패가 아니다. 정제대기로 돌려놓고 이번 차례는 멈춘다. 다음 1분에 다시 해 본다
      if (e instanceof GeminiBusyError) {
        await supabase.from('memos').update({ status: '정제대기', error_message: e.message }).eq('id', memo.id)
        result.busy = e.message
        break
      }
      const message = errorText(e, opts.vaultPath)
      await supabase.from('memos').update({ status: '실패', error_message: message }).eq('id', memo.id)
      result.failed.push(`메모 ${memo.id}: ${message}`)
    }
  }
  return result
}

async function createNote(app: App, memo: MemoRow, ask: (content: string) => Promise<string>, checkLinks: boolean): Promise<string> {
  const { title, body } = parseNote(await ask(memo.content))
  const path = freeNotePath(app, memo.target_folder, cleanTitle(title) || `메모 ${memo.id}`, memo.id)
  // Claude Code는 볼트를 직접 읽고 링크를 고르지만, Gemini는 후보 목록만 보므로 없는 노트 링크를 한 번 더 걸러 낸다
  const content = checkLinks ? dropMissingLinks(app, body, path) : body
  await ensureFolder(app, path.split('/').slice(0, -1).join('/'))
  await app.vault.create(path, noteBody(memo.id, memo.created_at, memo.tags, content))
  return path
}
