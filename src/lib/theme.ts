// 테마 적용 — 고른 테마를 html의 data-theme에 붙이고, 폰 상단바 색을 맞추고, 다음에 열 때 깜빡이지 않게 이 기기에도 적어 둔다
// 고른 값은 계정(profiles.theme)에 저장돼 폰과 컴퓨터가 같다. 화면이 그려지기 전의 첫 적용은 index.html의 짧은 스크립트가 한다
import { isThemeChoice, resolveTheme, THEME_SWATCH, type ThemeChoice } from './themeRules.ts'

/** index.html의 스크립트와 같은 키 */
export const THEME_STORAGE_KEY = 'personal-hub-theme'

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
let current: ThemeChoice = 'system'

/** 이 기기에 적어 둔 마지막 테마. 계정 설정을 불러오기 전까지 이것을 쓴다 */
export function cachedTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeChoice(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(choice: ThemeChoice) {
  current = choice
  const theme = resolveTheme(choice, darkQuery.matches)
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_SWATCH[theme].background)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // 저장하지 못해도 이번에는 적용된다
  }
}

// "기기 설정 따라가기"면 기기가 밝게·어둡게 바뀔 때 같이 바꾼다
darkQuery.addEventListener('change', () => {
  if (current === 'system') applyTheme('system')
})
