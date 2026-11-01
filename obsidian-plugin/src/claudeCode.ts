// Claude Code 실행 — 설치 위치를 찾고, 볼트를 읽기만 하도록 제한해 실행한 뒤 답을 돌려준다
// Obsidian은 터미널과 다른 환경으로 켜져서 'claude'라는 이름만으로는 찾지 못한다 (11월 1일 시험)
import { execFile, spawn, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { dirname } from 'path'
import { REFINE_SYSTEM_PROMPT } from './refinePrompt'

/** 정제 하나가 멈췄다고 볼 시간. 10분보다 짧아야 도는 도중에 버려진 작업으로 잘못 보지 않는다 */
const TIMEOUT_MS = 8 * 60 * 1000

let current: ChildProcess | null = null

/** 터미널에 설정된 PATH로 찾는다. zsh 시작 파일이 출력을 섞을 수 있어서 경로로 보이는 마지막 줄만 쓴다 */
function findInShell(): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('/bin/zsh', ['-ilc', 'command -v claude'], { timeout: 10_000 }, (_error, stdout) => {
      const line = stdout.trim().split('\n').at(-1)?.trim()
      resolve(line?.startsWith('/') && existsSync(line) ? line : null)
    })
  })
}

/** 저장해 둔 경로 → 흔한 설치 위치 → 터미널 설정 순서로 찾는다 */
export async function findClaude(saved?: string): Promise<string | null> {
  const candidates = [saved, `${homedir()}/.local/bin/claude`, '/opt/homebrew/bin/claude', '/usr/local/bin/claude']
  return candidates.find((path) => path && existsSync(path)) ?? (await findInShell())
}

/** 플러그인이 꺼질 때 실행 중인 정제를 멈춘다 */
export function stopClaude() {
  current?.kill('SIGTERM')
}

/** 볼트 폴더에서 Claude Code를 실행해 답을 돌려준다. 메모는 표준 입력으로 넘긴다 */
export function runClaude(claudePath: string, vaultPath: string, message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 읽기 도구만 허락한다. 셸과 쓰기 도구가 없어서 메모에 무슨 말이 있어도 볼트를 바꿀 수 없다
    const tools = ['Read', 'Glob', 'Grep']
    const args = [
      '-p',
      '--output-format',
      'json',
      '--permission-mode',
      'dontAsk',
      '--tools',
      ...tools,
      '--allowedTools',
      ...tools,
      // 사용자 계정에 등록된 다른 MCP(메일, DB 등)는 빼고 실행한다
      '--strict-mcp-config',
      '--no-session-persistence',
      '--append-system-prompt',
      REFINE_SYSTEM_PROMPT,
    ]
    // npm으로 설치한 Claude Code는 node가 필요하다. node는 대개 claude와 같은 폴더에 있다
    const env = { ...process.env, PATH: `${dirname(claudePath)}:${process.env.PATH ?? ''}` }
    const child = spawn(claudePath, args, { cwd: vaultPath, env, stdio: ['pipe', 'pipe', 'pipe'] })
    current = child

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.stdin.end(message)

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`Claude Code가 ${TIMEOUT_MS / 60000}분 안에 끝나지 않아서 멈췄어요.`))
    }, TIMEOUT_MS)
    child.on('error', (e) => {
      clearTimeout(timer)
      current = null
      reject(new Error(`Claude Code를 실행하지 못했어요: ${e.message}`))
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      current = null
      if (code !== 0) {
        reject(new Error(`Claude Code가 오류로 끝났어요(코드 ${code}): ${(stderr || stdout).trim().slice(-200)}`))
        return
      }
      // 로그인 만료처럼 Claude Code 쪽에서 막히면 is_error와 이유가 온다
      const parsed = JSON.parse(stdout) as { result?: string; is_error?: boolean }
      if (parsed.is_error) reject(new Error(`Claude Code 오류: ${(parsed.result ?? '').slice(0, 200)}`))
      else resolve(parsed.result ?? '')
    })
  })
}
