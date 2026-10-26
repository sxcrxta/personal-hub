// 워커 시작점 — `npm run login`(처음 한 번), `npm run setup`(볼트 경로 바꾸기), `npm start`(계속 켜 두기), `npm run logout`
// 켜 두면 1분마다 살아 있다는 신호를 보내고, 정제 대기 메모를 Claude Code로 영구 노트로 만든다. 오늘의 노트·자동 실행은 다음 단계에서 붙인다
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { loadConfig, saveConfig } from './config.ts'
import { HEARTBEAT_MS, sendHeartbeat } from './heartbeat.ts'
import { refinePendingMemos } from './refine.ts'
import { supabase } from './supabase.ts'

/** 정제 대기 메모를 확인하는 간격 */
const REFINE_MS = 60 * 1000

const time = () => new Date().toLocaleTimeString('ko-KR', { hour12: false })
const log = (message: string) => console.log(`[${time()}] ${message}`)

/** 비밀번호는 칠 때 화면에 보이지 않게 한다 */
async function askHidden(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true })
  const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput
  ;(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => {
    if (s.startsWith(question)) write.call(rl, s)
  }
  const answer = await rl.question(question)
  rl.close()
  stdout.write('\n')
  return answer
}

/** 볼트 폴더 전체 경로를 묻는다. .obsidian 폴더가 있어야 볼트로 본다 */
async function askVaultPath(rl: ReturnType<typeof createInterface>, current?: string): Promise<string | undefined> {
  const hint = current ? ` (그냥 Enter면 "${current}")` : ''
  const answer = (await rl.question(`정제한 노트를 저장할 볼트 폴더 전체 경로${hint}: `)).trim() || current
  if (answer && !existsSync(join(answer, '.obsidian'))) {
    console.error(`${answer} 안에 .obsidian 폴더가 없어서 볼트가 아닌 것 같아요. npm run setup으로 다시 정해 주세요.`)
    return current
  }
  return answer
}

async function login() {
  const rl = createInterface({ input: stdin, output: stdout })
  const config = loadConfig()
  const email = (await rl.question('Personal Hub 이메일: ')).trim()
  const deviceName = (await rl.question(`기기 이름 (그냥 Enter면 "${config.deviceName}"): `)).trim() || config.deviceName
  const vaultPath = await askVaultPath(rl, config.vaultPath)
  rl.close()
  const password = await askHidden('비밀번호: ')

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error(`로그인하지 못했어요: ${error.message}`)
    process.exit(1)
  }
  saveConfig({ ...config, deviceName, vaultPath })
  await sendHeartbeat(deviceName)
  log(`로그인했어요. "${deviceName}" 기기로 등록했어요. 이제 npm start로 켜 두면 돼요.`)
}

async function setup() {
  const rl = createInterface({ input: stdin, output: stdout })
  const config = loadConfig()
  const vaultPath = await askVaultPath(rl, config.vaultPath)
  rl.close()
  saveConfig({ ...config, vaultPath })
  log(vaultPath ? `볼트 경로를 "${vaultPath}"로 정했어요.` : '볼트 경로가 비어 있어요.')
}

async function logout() {
  await supabase.auth.signOut()
  log('로그아웃했어요.')
}

async function start() {
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    console.error('먼저 npm run login으로 로그인해 주세요.')
    process.exit(1)
  }
  const { deviceName, vaultPath, claudePath } = loadConfig()
  log(`${data.session.user.email} 계정, "${deviceName}" 기기로 워커를 켰어요. 끄려면 Ctrl+C`)

  // 신호 하나가 실패해도(인터넷 끊김 등) 멈추지 않고 다음 1분에 다시 보낸다
  const beat = async () => {
    try {
      await sendHeartbeat(deviceName)
      log('신호 보냄')
    } catch (e) {
      log(`신호를 보내지 못했어요: ${e instanceof Error ? e.message : JSON.stringify(e)}`)
    }
  }
  await beat()
  setInterval(beat, HEARTBEAT_MS)

  if (!vaultPath) {
    log('볼트 경로가 없어서 AI 정제는 하지 않아요. npm run setup으로 정해 주세요.')
    return
  }
  log(`정제한 노트는 ${vaultPath} 에 저장해요.`)
  // 정제 하나가 몇 분 걸릴 수 있어서, 앞의 것이 끝나기 전에는 다음 확인을 건너뛴다
  let refining = false
  const refine = async () => {
    if (refining) return
    refining = true
    try {
      await refinePendingMemos({ deviceName, vaultPath, claudePath, log })
    } catch (e) {
      log(`정제 대기 메모를 확인하지 못했어요: ${e instanceof Error ? e.message : JSON.stringify(e)}`)
    } finally {
      refining = false
    }
  }
  await refine()
  setInterval(refine, REFINE_MS)
}

const commands: Record<string, () => Promise<void>> = { login, setup, logout, start }
const command = commands[process.argv[2] ?? '']
if (!command) {
  console.error('사용법: npm run login | npm run setup | npm start | npm run logout')
  process.exit(1)
}
await command()
