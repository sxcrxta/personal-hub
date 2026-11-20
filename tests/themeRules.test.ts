// 테마 규칙 테스트 — 기기 설정 따라가기, 고른 테마, 모르는 값
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isThemeChoice, resolveTheme, THEME_CHOICES, THEME_SWATCH } from '../src/lib/themeRules.ts'

test('기기 설정 따라가기는 기기가 어두우면 밤 남색, 아니면 밝게', () => {
  assert.equal(resolveTheme('system', true), 'slate')
  assert.equal(resolveTheme('system', false), 'light')
})

test('직접 고른 테마는 기기 설정과 상관없이 그대로', () => {
  assert.equal(resolveTheme('light', true), 'light')
  assert.equal(resolveTheme('ink', false), 'ink')
  assert.equal(resolveTheme('black', false), 'black')
})

test('저장된 값이 깨졌거나 없으면 기기 설정을 따른다', () => {
  assert.equal(resolveTheme('purple', true), 'slate')
  assert.equal(resolveTheme(null, false), 'light')
  assert.equal(isThemeChoice('purple'), false)
})

test('고를 수 있는 테마마다 미리보기 색이 있다', () => {
  for (const t of THEME_CHOICES) {
    if (t.id !== 'system') assert.ok(THEME_SWATCH[t.id], t.id)
  }
})
