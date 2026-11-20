// 테마 규칙 — 고를 수 있는 테마 목록과, "기기 설정 따라가기"를 실제 테마로 바꾸는 규칙 (브라우저 없이 시험할 수 있게 따로 둔다)

/** 설정 창에서 고르는 값. system은 기기가 어두운 모드면 밤 남색, 아니면 밝게 */
export type ThemeChoice = 'system' | 'light' | 'slate' | 'ink' | 'black'
/** html에 실제로 붙는 테마 (theme.css의 data-theme) */
export type AppliedTheme = Exclude<ThemeChoice, 'system'>

export const THEME_CHOICES: { id: ThemeChoice; label: string; description: string }[] = [
  { id: 'system', label: '기기 설정 따라가기', description: '기기가 어두운 모드면 밤 남색으로 바뀌어요' },
  { id: 'light', label: '밝게', description: '기본 테마' },
  { id: 'slate', label: '밤 남색', description: '짙은 남색 바탕' },
  { id: 'ink', label: '먹색', description: '따뜻한 숯색 바탕, 밤에 눈이 편해요' },
  { id: 'black', label: '완전 검정', description: 'OLED 화면에서 배터리를 덜 써요' },
]

/** 설정 창 미리보기 동그라미와 폰 상단바(theme-color) 색. theme.css의 background·surface-container-lowest·on-surface와 같은 값 */
export const THEME_SWATCH: Record<AppliedTheme, { background: string; card: string; text: string }> = {
  light: { background: '#f7f9fb', card: '#ffffff', text: '#191c1e' },
  slate: { background: '#0b1220', card: '#111a2b', text: '#e5e9f0' },
  ink: { background: '#161412', card: '#1e1b18', text: '#ece4d8' },
  black: { background: '#000000', card: '#0d0d0d', text: '#f2f2f2' },
}

/** 기기가 어두운 모드일 때 "기기 설정 따라가기"가 쓰는 테마 */
export const SYSTEM_DARK: AppliedTheme = 'slate'

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return THEME_CHOICES.some((t) => t.id === value)
}

/** 고른 값을 실제로 붙일 테마로 바꾼다. 모르는 값이면 기기 설정을 따른다 */
export function resolveTheme(choice: unknown, prefersDark: boolean): AppliedTheme {
  if (isThemeChoice(choice) && choice !== 'system') return choice
  return prefersDark ? SYSTEM_DARK : 'light'
}
