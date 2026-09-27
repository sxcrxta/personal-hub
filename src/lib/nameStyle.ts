// 이름에 이모지를 자동으로 붙이는 규칙과 고를 수 있는 이모지 목록 (색은 subjectColor.ts)
const KEYWORDS: [RegExp, string][] = [
  [/수학|미적|확통|기하/, '📐'],
  [/물리/, '🧲'],
  [/화학/, '🧪'],
  [/생명|생물/, '🧬'],
  [/지구/, '🌏'],
  [/과학|탐구|실험/, '🔬'],
  [/국어|문학|독서/, '📚'],
  [/영어|영단어/, '🔤'],
  [/역사|한국사/, '🏛️'],
  [/사회|지리|경제|윤리/, '🌐'],
  [/물|수분/, '💧'],
  [/운동|달리기|스트레칭/, '🏃'],
  [/잠|취침|자기/, '🌙'],
  [/책|읽기/, '📖'],
  [/학교/, '🏫'],
  [/동아리/, '🧑‍🔬'],
  [/학원/, '🏢'],
  [/개인|일상/, '🌱'],
]

export const EMOJI_CHOICES = [
  '📐', '🧲', '🧪', '🧬', '🌏', '🔬', '📚', '🔤', '🏛️', '🌐',
  '📝', '📖', '✏️', '🎯', '💡', '📌', '🗂️', '📥', '🏫', '🏢',
  '💧', '🏃', '🌙', '☀️', '🍎', '🎵', '🎨', '💻', '🌱', '⭐',
]

export function emojiOf(name: string): string {
  for (const [pattern, emoji] of KEYWORDS) {
    if (pattern.test(name)) return emoji
  }
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return EMOJI_CHOICES[hash % EMOJI_CHOICES.length]
}
