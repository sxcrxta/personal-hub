// 플러그인 빌드 — src를 main.js 한 파일로 묶어 테스트 볼트의 플러그인 폴더에 바로 넣는다
// Supabase 주소와 공개 키는 웹과 같은 ../.env.local에서 읽는다(저장소에는 올리지 않는다)
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .map((line) => line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('../.env.local에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY가 있어야 합니다.')
}

// URL의 pathname은 한글 폴더 이름을 %ED%… 로 바꿔 버려서 fileURLToPath로 진짜 경로를 얻는다
const outdir = fileURLToPath(new URL('../test-vault/.obsidian/plugins/personal-hub/', import.meta.url))
mkdirSync(outdir, { recursive: true })
copyFileSync(new URL('./manifest.json', import.meta.url), `${outdir}manifest.json`)

const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  external: ['obsidian', 'electron'],
  outfile: `${outdir}main.js`,
  define: {
    __SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL),
    __SUPABASE_KEY__: JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY),
  },
  logLevel: 'info',
}

if (process.argv.includes('--watch')) {
  await (await esbuild.context(options)).watch()
} else {
  await esbuild.build(options)
}
