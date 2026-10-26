// AI 정제 — '정제 대기' 메모를 잠그고, 볼트의 permanent-note-auto 스킬을 Claude Code(claude -p)로 실행해
// 영구 노트를 만든 뒤 상태와 파일 경로를 DB에 되돌려 적는다 (architecture.md 2-2절)
// 가져오기·잠그기 규칙은 Obsidian 플러그인(obsidian-plugin/src/fetchMemos.ts)과 같다
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { CONFIG_DIR } from './config.ts'
import { supabase } from './supabase.ts'

/** 처리 중인 채 이 시간이 지나면 버려진 작업으로 보고 다시 집어 간다 (결정 B) */
const STALE_MS = 10 * 60 * 1000
const MAX_RETRY = 3
/** Claude Code 실행 시간 제한 (위험 6). 10분보다 짧아야 도는 도중에 버려진 작업으로 잘못 보지 않는다 */
const CLAUDE_TIMEOUT_MS = 8 * 60 * 1000
/** 스킬에 넘길 메모 파일을 잠깐 두는 곳. 볼트 밖이라 검색 인덱스에 섞이지 않는다 */
const JOB_DIR = join(CONFIG_DIR, 'jobs')
/** 스킬이 연관 노트를 찾을 때 쓰는 볼트 검색 도구 */
const QMD_TOOLS = ['mcp__qmd__query', 'mcp__qmd__get', 'mcp__qmd__multi_get', 'mcp__qmd__status']

type MemoRow = {
  id: number
  content: string
  status: '정제대기' | '처리중'
  claimed_at: string | null
  retry_count: number
}

type RefineOptions = {
  deviceName: string
  vaultPath: string
  claudePath: string
  log: (message: string) => void
}

export async function refinePendingMemos(opts: RefineOptions): Promise<void> {
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString()
  const { data: memos, error } = await supabase
    .from('memos')
    .select('id, content, status, claimed_at, retry_count')
    .eq('save_mode', '정제')
    .or(`status.eq.정제대기,and(status.eq.처리중,claimed_at.lt."${staleBefore}")`)
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
      opts.log(`메모 ${memo.id}: 재시도 한도를 넘어 실패로 두었어요`)
      continue
    }

    // 잠그기 — 읽었을 때와 상태가 그대로일 때만 바뀐다. 0줄이면 다른 기기가 먼저 가져간 것이다
    let claim = supabase
      .from('memos')
      .update({
        status: '처리중',
        claimed_at: new Date().toISOString(),
        claimed_by: opts.deviceName,
        retry_count: stale ? memo.retry_count + 1 : memo.retry_count,
      })
      .eq('id', memo.id)
      .eq('status', memo.status)
    if (stale && memo.claimed_at) claim = claim.eq('claimed_at', memo.claimed_at)
    const { data: claimed, error: claimError } = await claim.select('id')
    if (claimError) throw claimError
    if (!claimed?.length) continue

    opts.log(`메모 ${memo.id}: 정제 시작`)
    try {
      const { path, review } = await runSkill(memo, opts)
      const { error: doneError } = await supabase
        .from('memos')
        .update({ status: '완료', note_path: path, error_message: null })
        .eq('id', memo.id)
      if (doneError) throw doneError
      opts.log(`메모 ${memo.id}: ${path} 저장${review ? ' (검토 필요 항목 있음)' : ''}`)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      await supabase.from('memos').update({ status: '실패', error_message: message }).eq('id', memo.id)
      opts.log(`메모 ${memo.id}: 실패 — ${message}`)
    }
  }
}

/** 스킬을 실행하고 마지막 줄(NOTE_PATH / NOTE_REVIEW / NOTE_ERROR)을 읽는다 */
async function runSkill(memo: MemoRow, opts: RefineOptions): Promise<{ path: string; review: boolean }> {
  // 스킬은 메모를 파일 경로로 받는다. 메모 원본은 DB에 그대로 남고 이 파일은 끝나면 지운다 (위험 7)
  mkdirSync(JOB_DIR, { recursive: true, mode: 0o700 })
  const memoFile = join(JOB_DIR, `memo-${memo.id}.md`)
  writeFileSync(memoFile, memo.content, { mode: 0o600 })
  try {
    const output = await runClaude(opts.claudePath, opts.vaultPath, [
      '-p',
      `/permanent-note-auto ${memoFile}`,
      '--output-format',
      'json',
      // 미리 허락한 도구만 쓰고 나머지는 묻지 않고 거절한다. 셸(Bash)과 기존 파일 고치기(Edit)는 아예 없다
      '--permission-mode',
      'dontAsk',
      '--tools',
      'Read',
      'Write',
      'Glob',
      'Grep',
      '--allowedTools',
      'Read',
      'Glob',
      'Grep',
      // 새 노트는 Slip-box 안에만 쓸 수 있다. 파일 경로 권한은 Write가 아니라 Edit(...) 규칙으로 적어야 Write 도구에도 걸린다
      // (처음에 Write(경로)로 적었더니 경로를 붙인 모양은 전부 거부됐다. 작업 폴더가 볼트라서 ./ 로 시작하는 상대 경로를 쓴다)
      'Edit(./0. Slip-box/**)',
      ...QMD_TOOLS,
      '--add-dir',
      JOB_DIR,
      // 볼트 검색(QMD)만 붙이고, 내 계정에 등록된 다른 MCP(Supabase 등)는 빼고 실행한다
      '--mcp-config',
      JSON.stringify({ mcpServers: { qmd: { type: 'stdio', command: 'qmd', args: ['mcp'] } } }),
      '--strict-mcp-config',
      '--no-session-persistence',
      '--append-system-prompt',
      `이번 실행의 볼트 루트는 현재 작업 디렉터리(${opts.vaultPath})다.`,
    ])

    // 로그인 만료처럼 Claude Code 쪽에서 막히면 is_error와 이유가 온다
    const parsed = JSON.parse(output) as { result?: string; is_error?: boolean }
    const result = parsed.result ?? ''
    if (parsed.is_error) throw new Error(`Claude Code 오류: ${result.slice(0, 200)}`)
    const last = result
      .split('\n')
      .map((line) => line.trim().match(/^(NOTE_PATH|NOTE_REVIEW|NOTE_ERROR):\s*(.+)$/))
      .filter((m) => m !== null)
      .at(-1)
    if (!last) throw new Error('스킬이 결과 줄(NOTE_PATH 등)을 남기지 않았어요.')
    if (last[1] === 'NOTE_ERROR') throw new Error(`스킬이 노트를 만들지 못했어요: ${last[2]}`)

    // 웹이 노트가 정말 생겼는지 아는 방법은 이 경로뿐이라, 적기 전에 파일이 있는지 직접 확인한다
    const path = last[2].replace(/^`|`$/g, '')
    if (isAbsolute(path) || path.split('/').includes('..') || !existsSync(join(opts.vaultPath, path))) {
      throw new Error(`스킬이 알려 준 노트 파일이 볼트에 없어요: ${path}`)
    }
    return { path, review: last[1] === 'NOTE_REVIEW' }
  } finally {
    rmSync(memoFile, { force: true })
  }
}

/** claude를 볼트 폴더에서 실행하고 표준 출력을 돌려준다. 시간 제한을 넘기면 끈다 */
function runClaude(claudePath: string, cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(claudePath, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`Claude Code가 ${CLAUDE_TIMEOUT_MS / 60000}분 안에 끝나지 않아서 멈췄어요.`))
    }, CLAUDE_TIMEOUT_MS)
    child.on('error', (e) => {
      clearTimeout(timer)
      reject(new Error(`Claude Code를 실행하지 못했어요: ${e.message}`))
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(stdout)
      else reject(new Error(`Claude Code가 오류로 끝났어요(코드 ${code}): ${(stderr || stdout).trim().slice(-200)}`))
    })
  })
}
