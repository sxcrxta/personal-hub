// 노트 파일 이름과 내용 만들기 — 설정 창의 파일 이름 형식에 날짜와 메모 번호를 채우고, 맨 위에 프론트매터를 붙인다
import { normalizePath } from 'obsidian'

/** 파일 이름에 쓸 수 없는 글자 (architecture.md 위험 4) */
const BAD_CHARS = /[\\/:*?"<>|]/g

/**
 * 'yyyy-MM-dd 메모 {번호}' → '2026-10-26 메모 12'
 * 번호가 이름에 꼭 들어가야 같은 메모를 다시 처리해도 같은 파일을 가리킨다 (architecture.md 위험 2).
 * 그래서 형식에 {번호}가 없으면 맨 뒤에 붙인다.
 */
export function noteFileName(format: string, memoId: number, createdAt: string, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(createdAt))
      .map((p) => [p.type, p.value]),
  )
  let name = format.trim() || 'yyyy-MM-dd 메모 {번호}'
  if (!name.includes('{번호}')) name += ' {번호}'
  name = name
    .replace(/yyyy/g, parts.year)
    .replace(/MM/g, parts.month)
    .replace(/dd/g, parts.day)
    .replace(/HH/g, parts.hour)
    .replace(/mm/g, parts.minute)
    .replace(/\{번호\}/g, String(memoId))
    .replace(BAD_CHARS, '-')
    .trim()
  return `${name}.md`
}

/** 볼트 안쪽 경로: '0. Slip-box/2026-10-26 메모 12.md' */
export function notePath(folder: string, fileName: string): string {
  const clean = folder.trim().replace(/^\/+|\/+$/g, '')
  return normalizePath(clean ? `${clean}/${fileName}` : fileName)
}

/** 프론트매터(메모 번호, 만든 시각, 해시태그) + 원문 그대로 */
export function noteBody(memoId: number, createdAt: string, tags: string[], content: string): string {
  const lines = ['---', `memo_id: ${memoId}`, `created: ${createdAt}`]
  const cleanTags = tags.map((t) => t.replace(/^#/, '').trim()).filter(Boolean)
  if (cleanTags.length) {
    lines.push('tags:', ...cleanTags.map((t) => `  - ${JSON.stringify(t)}`))
  }
  lines.push('source: personal-hub', '---', '', content.trimEnd(), '')
  return lines.join('\n')
}
