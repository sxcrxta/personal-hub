// 습관 규칙 테스트 — 연속 기록은 하는 요일만 세고, 오늘은 아직 안 했어도 끊기지 않는다
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TODAY } from './clock.ts'
import type { Habit } from '../src/types/data.ts'
import { streakOf } from '../src/lib/habitRules.ts'

// 월·수·금 습관. 오늘(11/18)은 수요일
const habit = (logs: string[]): Habit => ({ id: 'h', name: '달리기', emoji: '🏃', days: [1, 3, 5], logs })

test('하는 요일이 아닌 날(화·목·토·일)은 건너뛰고 센다', () => {
  // 월(11/16)·금(11/13)·수(11/11) 체크, 오늘은 아직
  assert.equal(streakOf(habit(['2026-11-16', '2026-11-13', '2026-11-11'])), 3)
})

test('오늘 체크하면 오늘도 센다', () => {
  assert.equal(streakOf(habit([TODAY, '2026-11-16', '2026-11-13'])), 3)
})

test('하는 요일을 하루 빠뜨리면 거기서 끊긴다', () => {
  // 금(11/13)을 빠뜨렸다
  assert.equal(streakOf(habit(['2026-11-16', '2026-11-11', '2026-11-09'])), 1)
})

test('기록이 없으면 0, 쉬는 날에 한 기록은 세지 않는다', () => {
  assert.equal(streakOf(habit([])), 0)
  assert.equal(streakOf(habit(['2026-11-17'])), 0)
})
