// '지금 가져오기' 한 번의 흐름 — 대기 메모를 잠그고, 볼트에 노트를 만들고, 상태와 파일 경로를 DB에 되돌려 적는다
// 단계별 설명은 docs/architecture.md 2-1절(4~6단계)과 7절 결정 B에 있다
import { TFile, type App } from 'obsidian'
import type { SupabaseClient } from '@supabase/supabase-js'
import { noteBody, noteFileName, notePath } from './noteFile'

/** 처리 중인 채 이 시간이 지나면 버려진 작업으로 보고 다시 집어 간다 (결정 B) */
const STALE_MS = 10 * 60 * 1000
/** 다시 집어 가는 횟수 한도. 넘으면 실패로 두고 더 시도하지 않는다 */
const MAX_RETRY = 3

type MemoRow = {
  id: number
  content: string
  tags: string[]
  target_folder: string
  status: '대기중' | '처리중'
  claimed_at: string | null
  retry_count: number
  created_at: string
}

export type FetchResult = {
  created: number // 새로 만든 노트
  existed: number // 이미 볼트에 있어서 상태만 완료로 바꾼 것
  failed: string[] // 실패한 메모 번호와 이유
  skipped: number // 그 사이 다른 기기가 가져간 것
}

export async function fetchPendingMemos(app: App, supabase: SupabaseClient, deviceName: string): Promise<FetchResult> {
  const result: FetchResult = { created: 0, existed: 0, failed: [], skipped: 0 }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('file_name_format, timezone')
    .single()
  if (profileError) throw profileError

  // 원문 저장이면서 '대기중'이거나, '처리중'인데 10분 넘게 멈춰 있는 내 메모를 오래된 순서로
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString()
  const { data: memos, error } = await supabase
    .from('memos')
    .select('id, content, tags, target_folder, status, claimed_at, retry_count, created_at')
    .eq('save_mode', '원문')
    .or(`status.eq.대기중,and(status.eq.처리중,claimed_at.lt."${staleBefore}")`)
    .order('created_at')
  if (error) throw error

  for (const memo of memos as MemoRow[]) {
    const stale = memo.status === '처리중'

    if (stale && memo.retry_count >= MAX_RETRY) {
      await supabase
        .from('memos')
        .update({ status: '실패', error_message: `처리 중에 멈춘 일이 ${MAX_RETRY}번 넘게 생겨서 더 시도하지 않았어요.` })
        .eq('id', memo.id)
        .eq('status', '처리중')
      result.failed.push(`메모 ${memo.id}: 재시도 한도 초과`)
      continue
    }

    // 잠그기 — 읽었을 때와 상태가 그대로일 때만 바뀐다. 그 사이 다른 기기가 가져갔으면 0줄이 바뀌고 건너뛴다
    let claim = supabase
      .from('memos')
      .update({
        status: '처리중',
        claimed_at: new Date().toISOString(),
        claimed_by: deviceName,
        retry_count: stale ? memo.retry_count + 1 : memo.retry_count,
      })
      .eq('id', memo.id)
      .eq('status', memo.status)
    if (stale && memo.claimed_at) claim = claim.eq('claimed_at', memo.claimed_at)
    const { data: claimed, error: claimError } = await claim.select('id')
    if (claimError) throw claimError
    if (!claimed?.length) {
      result.skipped++
      continue
    }

    const path = notePath(
      memo.target_folder,
      noteFileName(profile.file_name_format, memo.id, memo.created_at, profile.timezone),
    )
    try {
      // 같은 이름이 이미 있으면 지난번에 만들고 DB 기록 직전에 멈춘 것이다. 새로 만들지 않는다 (위험 2)
      const existing = app.vault.getAbstractFileByPath(path)
      if (existing && !(existing instanceof TFile)) throw new Error(`${path}에 같은 이름의 폴더가 있어요.`)
      if (existing) {
        result.existed++
      } else {
        await ensureFolder(app, path.split('/').slice(0, -1).join('/'))
        await app.vault.create(path, noteBody(memo.id, memo.created_at, memo.tags, memo.content))
        result.created++
      }
      const { error: doneError } = await supabase
        .from('memos')
        .update({ status: '완료', note_path: path, error_message: null })
        .eq('id', memo.id)
      if (doneError) throw doneError
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      await supabase.from('memos').update({ status: '실패', error_message: message }).eq('id', memo.id)
      result.failed.push(`메모 ${memo.id}: ${message}`)
    }
  }
  return result
}

/** 없는 폴더는 한 단계씩 만든다 (결정 A: 폴더 이름은 사람이 입력한 것이라 실제로 없을 수 있다) */
async function ensureFolder(app: App, folder: string) {
  let current = ''
  for (const part of folder.split('/').filter(Boolean)) {
    current = current ? `${current}/${part}` : part
    if (!app.vault.getAbstractFileByPath(current)) await app.vault.createFolder(current)
  }
}
