// 워커 설정과 로그인 정보를 맥북 안 ~/.personal-hub-worker/ 폴더에 읽고 쓴다
// 이 폴더는 저장소 밖이라 커밋되지 않는다. 비밀번호는 저장하지 않고 로그인 토큰만 둔다
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const CONFIG_DIR = join(homedir(), '.personal-hub-worker')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const SESSION_FILE = join(CONFIG_DIR, 'session.json')

export type WorkerConfig = {
  deviceName: string
  /** 볼트 폴더의 전체 경로. 이 맥북 안에만 두고 DB에는 올리지 않는다 (CLAUDE.md 5절) */
  vaultPath?: string
  /** Claude Code 실행 파일 */
  claudePath: string
}

const DEFAULT_CONFIG: WorkerConfig = { deviceName: '맥북', claudePath: 'claude' }

function readJson<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback
  return { ...fallback, ...JSON.parse(readFileSync(file, 'utf8')) }
}

/** 나만 읽고 쓸 수 있게(600) 저장한다. 토큰이 들어 있어서다 */
function writeJson(file: string, value: unknown) {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
  writeFileSync(file, JSON.stringify(value, null, 2))
  chmodSync(file, 0o600)
}

export const loadConfig = () => readJson(CONFIG_FILE, DEFAULT_CONFIG)
export const saveConfig = (config: WorkerConfig) => writeJson(CONFIG_FILE, config)

export const loadSession = () => readJson<Record<string, string>>(SESSION_FILE, {})
export const saveSession = (session: Record<string, string>) => writeJson(SESSION_FILE, session)

/** Supabase 주소와 공개 키 — 웹과 같은 ../.env.local에서 읽는다 */
export function loadSupabaseEnv(): { url: string; key: string } {
  const file = new URL('../../.env.local', import.meta.url)
  const env = Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
      .filter((m) => m !== null)
      .map((m) => [m[1], m[2]]),
  )
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('.env.local에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY가 있어야 합니다.')
  }
  return { url: env.VITE_SUPABASE_URL, key: env.VITE_SUPABASE_PUBLISHABLE_KEY }
}
