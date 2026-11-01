// Mac 설치 앱 본체(JXA) — 고른 볼트에 Personal Hub 플러그인을 넣고 켜 둔다. build.sh가 .app으로 묶는다
// 시험할 때는 화면 없이 실행한다: osascript -l JavaScript install.js <볼트 경로> <플러그인 파일 폴더>
ObjC.import('Foundation')

const APP_NAME = 'Personal Hub 설치'
const PLUGIN_ID = 'personal-hub'
/** 로그인 토큰이 든 data.json은 건드리지 않도록 이 두 파일만 복사한다 */
const PLUGIN_FILES = ['main.js', 'manifest.json']

const system = Application.currentApplication()
system.includeStandardAdditions = true

/** 볼트 경로에 공백·한글·따옴표가 있어도 셸이 한 덩어리로 읽게 감싼다 */
const quote = (text) => `'${text.replace(/'/g, `'\\''`)}'`
const exists = (path) => $.NSFileManager.defaultManager.fileExistsAtPath(path)

function readJson(path, fallback) {
  if (!exists(path)) return fallback
  const text = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)
  return JSON.parse(text.js)
}

function writeJson(path, value) {
  const text = $(JSON.stringify(value, null, 2))
  const saved = text.writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null)
  if (!saved) throw new Error(`${path} 파일을 저장하지 못했어요.`)
}

/** manifest의 버전. 파일이 없거나 깨졌으면 비교하지 않고 덮어쓰도록 빈 값을 돌려준다 */
function versionIn(folder) {
  try {
    return readJson(`${folder}/manifest.json`, {}).version ?? ''
  } catch {
    return ''
  }
}

/** '0.4.0'이 '0.5.0'보다 낮은지 숫자로 비교한다 */
function isOlder(version, other) {
  const a = version.split('.').map(Number)
  const b = other.split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0)
  }
  return false
}

function install(vaultPath, pluginDir) {
  // 목록 파일이 깨져 있으면 아무것도 바꾸기 전에 멈춘다
  const listFile = `${vaultPath}/.obsidian/community-plugins.json`
  const enabled = readJson(listFile, [])
  if (!Array.isArray(enabled)) throw new Error('community-plugins.json의 내용이 목록이 아니에요.')

  const target = `${vaultPath}/.obsidian/plugins/${PLUGIN_ID}`
  // 예전에 열어 둔 설치 디스크의 앱을 실행하면 옛 버전이 새 버전을 덮어쓴다 (11월 1일에 실제로 일어남)
  const bundled = versionIn(pluginDir)
  const installed = versionIn(target)
  if (bundled && installed && isOlder(bundled, installed)) {
    throw new Error(`이 볼트에는 이미 더 새로운 ${installed} 버전이 있어요. 이 설치 파일은 ${bundled} 버전이에요. 열려 있는 설치 디스크를 꺼내고 웹에서 다시 내려받아 주세요.`)
  }
  system.doShellScript(`mkdir -p ${quote(target)}`)
  for (const name of PLUGIN_FILES) {
    system.doShellScript(`cp ${quote(`${pluginDir}/${name}`)} ${quote(`${target}/${name}`)}`)
  }
  if (!enabled.includes(PLUGIN_ID)) writeJson(listFile, [...enabled, PLUGIN_ID])
}

/** Finder 창에서 볼트 폴더를 고른다. 볼트가 아니면 다시 고르게 하고, 취소하면 null */
function chooseVault(say) {
  for (;;) {
    let folder
    try {
      folder = system.chooseFolder({ withPrompt: 'Personal Hub를 설치할 Obsidian 볼트 폴더를 골라 주세요.' })
    } catch {
      return null // 취소를 누르면 오류로 온다
    }
    const vaultPath = folder.toString().replace(/\/$/, '')
    if (exists(`${vaultPath}/.obsidian`)) return vaultPath
    say('이 폴더는 Obsidian 볼트가 아니에요. Obsidian에서 한 번 연 볼트 폴더를 골라 주세요.')
  }
}

function runWithDialogs() {
  const say = (message) => system.displayDialog(message, { withTitle: APP_NAME, buttons: ['확인'], defaultButton: '확인' })
  const vaultPath = chooseVault(say)
  if (!vaultPath) return

  try {
    install(vaultPath, `${$.NSBundle.mainBundle.resourcePath.js}/plugin`)
  } catch (e) {
    say(`설치하지 못했어요: ${e.message}`)
    return
  }
  say(
    '설치했어요. Obsidian을 완전히 종료(⌘Q)했다가 다시 여세요. 커뮤니티 플러그인을 켜겠냐고 물으면 켜 주세요. 그다음 설정의 Personal Hub에서 로그인하면 끝이에요.',
  )
}

// osascript와 .app이 이 이름의 함수를 시작점으로 부른다
// oxlint-disable-next-line no-unused-vars
function run(argv) {
  if (argv && argv.length === 2) {
    install(argv[0], argv[1])
    return '설치했어요'
  }
  runWithDialogs()
}
