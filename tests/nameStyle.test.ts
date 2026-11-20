// 이름별 색·이모지 자동 배정 테스트 — 아는 과목은 정해진 것, 모르는 이름은 늘 같은 것
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EMOJI_CHOICES, emojiOf } from '../src/lib/nameStyle.ts'
import { paletteOf } from '../src/lib/subjectColor.ts'

test('아는 과목은 정해진 색', () => {
  assert.equal(paletteOf('미적분'), 'math')
  assert.equal(paletteOf('화학Ⅱ'), 'science')
  assert.equal(paletteOf('문학'), 'korean')
  assert.equal(paletteOf('영어 독해'), 'english')
  assert.equal(paletteOf('한국사'), 'social')
})

test('아는 이름은 정해진 이모지. 더 구체적인 이름이 먼저', () => {
  assert.equal(emojiOf('수학'), '📐')
  assert.equal(emojiOf('물리학'), '🧲') // '물'보다 '물리'가 먼저
  assert.equal(emojiOf('지구과학'), '🌏') // '과학'보다 '지구'가 먼저
  assert.equal(emojiOf('물 마시기'), '💧')
})

test('모르는 이름은 목록 안에서 고르고, 몇 번을 물어도 같다', () => {
  for (const name of ['정보과학 프로젝트', '봉사', 'zzz']) {
    assert.equal(paletteOf(name), paletteOf(name))
    assert.equal(emojiOf(name), emojiOf(name))
    assert.ok(EMOJI_CHOICES.includes(emojiOf('봉사')))
  }
})
