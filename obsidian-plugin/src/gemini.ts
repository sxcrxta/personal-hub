// Gemini 정제 — Claude Code가 없는 사람을 위해, 사용자가 설정에 넣은 무료 키로 Gemini를 부르고 볼트에서 연관 노트 후보를 골라 함께 보낸다
// 키는 이 컴퓨터의 플러그인 설정 파일(data.json)에만 있다. DB나 서버로 보내지 않는다 (CLAUDE.md 3절)
import { requestUrl, type App, type TFile } from 'obsidian'
import { GEMINI_SYSTEM_PROMPT, geminiMessage, type Candidate } from './refinePrompt'

/**
 * 앞에서부터 차례로 써 본다. 무료 키로 시험해 보니 Flash는 몇 분씩 답이 없거나 503(사용자 많음)이 났고, Flash-Lite는 몇 초 만에 답했다 (11월 19일)
 * 그래서 Flash-Lite를 앞에 둔다. 모델이 없거나(404), 사용량을 다 썼거나(429), 붐비거나(503), 시간이 지나면 다음 모델로 넘어간다
 */
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash']
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
/** 모델 하나가 이보다 오래 답하지 않으면 멈춘 것으로 보고 다음 모델로 넘어간다 */
const TIMEOUT_MS = 90 * 1000
/** Gemini에 보낼 연관 노트 후보 수와, 후보마다 보낼 앞부분 길이 */
const MAX_CANDIDATES = 12
const EXCERPT_CHARS = 300

/** 사용량 초과나 서버 일시 오류처럼 기다리면 풀리는 문제. 메모를 실패로 두지 않고 정제대기로 돌려놓는다 */
export class GeminiBusyError extends Error {}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
  error?: { message?: string; status?: string }
}

/** 시간이 지나면 null. requestUrl은 중간에 끊을 수 없어서 기다리기만 멈춘다 */
function withTimeout<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS))])
}

/** 키 하나로 Gemini에 묻고 답 글자를 돌려준다. 오류 메시지에는 키를 절대 넣지 않는다 */
export async function askGemini(apiKey: string, system: string, message: string): Promise<string> {
  let quota = false
  for (const model of MODELS) {
    // requestUrl은 Obsidian이 브라우저 제한(CORS) 없이 보내 주는 요청이다. 키는 주소가 아니라 머리글에 넣는다
    const res = await withTimeout(
      requestUrl({
        url: `${ENDPOINT}/${model}:generateContent`,
        method: 'POST',
        contentType: 'application/json',
        headers: { 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { temperature: 0.4 },
        }),
        throw: false,
      }),
    )
    if (!res) continue
    let data: GeminiResponse = {}
    try {
      data = res.json as GeminiResponse
    } catch {
      // 답이 JSON이 아니면 아래에서 상태 번호로 판단한다
    }
    if (res.status === 429) quota = true
    if (res.status === 404 || res.status === 429 || res.status >= 500) continue
    if (res.status === 400 && /API key|API_KEY/i.test(data.error?.message ?? '')) throw new Error('Gemini API 키가 맞지 않아요. 설정에서 다시 붙여 넣어 주세요.')
    if (res.status === 403) throw new Error('Gemini API 키에 권한이 없어요. Google AI Studio에서 새 키를 받아 주세요.')
    if (res.status !== 200) throw new Error(`Gemini 오류(${res.status}): ${(data.error?.message ?? '').slice(0, 200)}`)

    if (data.promptFeedback?.blockReason) throw new Error(`Gemini가 메모를 거절했어요(${data.promptFeedback.blockReason}).`)
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim()
    if (!text) throw new Error(`Gemini의 답이 비어 있어요(${data.candidates?.[0]?.finishReason ?? '이유 모름'}).`)
    return text
  }
  // 모든 모델이 안 되면 기다리면 풀리는 문제로 본다. 메모는 정제대기로 돌아가 다음 1분에 다시 해 본다
  throw new GeminiBusyError(
    quota ? 'Gemini 무료 사용량을 다 썼어요. 사용량이 다시 차면 이어서 처리돼요.' : 'Gemini가 지금 붐벼서 답하지 않아요. 다음에 다시 처리돼요.',
  )
}

/** 한국어 조사를 떼어 낸 낱말 목록. "공부를"과 "공부"가 같은 낱말로 잡히게 한다 */
function keywords(text: string): string[] {
  const particles = /(으로|에서|에게|까지|부터|처럼|보다|이라|이다|하고|하는|했다|해서|은|는|이|가|을|를|에|의|도|로|과|와|만)$/
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => (w.length > 2 ? w.replace(particles, '') : w))
    .filter((w) => w.length >= 2)
  return [...new Set(words)]
}

/** 노트가 아닌 파일(설정·템플릿·숨김 폴더)은 후보에서 뺀다 */
function isNote(file: TFile): boolean {
  return !file.path.split('/').some((part) => part.startsWith('.') || /^(templates?|템플릿)$/i.test(part))
}

/**
 * 메모와 낱말이 많이 겹치는 노트를 후보로 고른다. Claude Code처럼 볼트를 직접 검색하지 못하는 Gemini를 위해 플러그인이 대신 찾는다
 * 제목·태그·소제목으로 먼저 추리고, 상위 노트만 본문을 읽어 다시 점수를 매긴다. 볼트가 커도 전체 본문을 읽지 않는다
 */
export async function findCandidates(app: App, memo: string, exclude?: string): Promise<Candidate[]> {
  const words = keywords(memo)
  if (!words.length) return []
  const count = (text: string) => words.filter((w) => text.includes(w)).length

  const byMeta = app.vault
    .getMarkdownFiles()
    .filter((f) => isNote(f) && f.path !== exclude)
    .map((file) => {
      const cache = app.metadataCache.getFileCache(file)
      const tags = [...(cache?.tags ?? []).map((t) => t.tag), ...[cache?.frontmatter?.tags ?? []].flat()].join(' ')
      const headings = (cache?.headings ?? []).map((h) => h.heading).join(' ')
      return { file, score: count(file.basename.toLowerCase()) * 3 + count(`${tags} ${headings}`.toLowerCase()) }
    })
    .sort((a, b) => b.score - a.score || b.file.stat.mtime - a.file.stat.mtime)
    .slice(0, 40)

  const scored = await Promise.all(
    byMeta.map(async ({ file, score }) => {
      const body = await app.vault.cachedRead(file)
      return { file, body, score: score + count(body.toLowerCase()) }
    }),
  )
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES)
    .map(({ file, body }) => ({
      title: file.basename,
      // 프론트매터는 빼고 본문 앞부분만 보낸다
      excerpt: body.replace(/^---\n[\s\S]*?\n---\n/, '').trim().slice(0, EXCERPT_CHARS),
    }))
}

/** 메모를 Gemini로 정제한 답(TITLE/---NOTE--- 형식)을 돌려준다 */
export async function refineWithGemini(app: App, apiKey: string, memo: string): Promise<string> {
  const candidates = await findCandidates(app, memo)
  return askGemini(apiKey, GEMINI_SYSTEM_PROMPT, geminiMessage(memo, candidates))
}

/** Gemini가 없는 노트로 링크를 만들었으면 괄호를 벗겨 글자만 남긴다. 빈 링크가 생기지 않게 한다 */
export function dropMissingLinks(app: App, body: string, sourcePath: string): string {
  return body.replace(/\[\[([^\]|#]+)([^\]]*)\]\]/g, (link, target: string) =>
    app.metadataCache.getFirstLinkpathDest(target.trim(), sourcePath) ? link : target.trim(),
  )
}
