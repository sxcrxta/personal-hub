// 과목·카테고리 이름에 파스텔 색을 붙이는 규칙 — 아는 과목은 정해진 색, 모르는 이름은 이름으로 골라 늘 같은 색
export type Palette = 'math' | 'science' | 'korean' | 'english' | 'social'

const KNOWN: [RegExp, Palette][] = [
  [/수학|미적|확통|기하/, 'math'],
  [/과학|물리|화학|생명|지구|탐구/, 'science'],
  [/국어|독서|문학|화작|언매/, 'korean'],
  [/영어/, 'english'],
  [/사회|역사|한국사|지리|윤리|경제|정치/, 'social'],
]

const ORDER: Palette[] = ['math', 'science', 'korean', 'english', 'social']

export function paletteOf(name: string): Palette {
  for (const [pattern, palette] of KNOWN) {
    if (pattern.test(name)) return palette
  }
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return ORDER[hash % ORDER.length]
}
