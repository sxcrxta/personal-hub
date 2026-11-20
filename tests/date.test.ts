// 날짜 공용 함수 테스트 — 한국 시간 기준으로 오늘·며칠 뒤·D-Day를 맞게 계산하는지
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TODAY } from './clock.ts'
import { dDayLabel, daysFromToday, fromDateAndTime, fromUtc, shiftDateKey, thisWeekKeys, todayKey, toUtc, weekdayOf } from '../src/lib/date.ts'

test('오늘 날짜는 한국 시간 기준', () => {
  assert.equal(todayKey(), TODAY)
})

test('UTC로 저장된 시각을 한국 날짜로 바꿔 며칠 뒤인지 센다', () => {
  // 11월 18일 15:30 UTC는 한국 시간 11월 19일 00:30이라 내일이다
  assert.equal(daysFromToday(fromUtc('2026-11-18T15:30:00Z')), 1)
  // 11월 18일 14:59 UTC는 한국 시간 23:59라 아직 오늘이다
  assert.equal(daysFromToday(fromUtc('2026-11-18T14:59:00Z')), 0)
})

test('한국 시간과 UTC 사이를 오가도 같은 시각', () => {
  const dt = fromDateAndTime('2026-11-18', '09:00')
  assert.equal(toUtc(dt), '2026-11-18T00:00:00.000Z')
  assert.equal(fromUtc(toUtc(dt)).toMillis(), dt.toMillis())
})

test('D-Day 표시', () => {
  assert.equal(dDayLabel(0), 'D-Day')
  assert.equal(dDayLabel(3), 'D-3')
  assert.equal(dDayLabel(-1), 'D+1')
})

test('날짜 더하기는 달과 해를 넘어간다', () => {
  assert.equal(shiftDateKey('2026-11-30', 1), '2026-12-01')
  assert.equal(shiftDateKey('2026-12-31', 1), '2027-01-01')
  assert.equal(shiftDateKey('2026-03-01', -1), '2026-02-28')
})

test('요일 번호는 월요일 1부터 일요일 7까지', () => {
  assert.equal(weekdayOf('2026-11-16'), 1)
  assert.equal(weekdayOf(TODAY), 3)
  assert.equal(weekdayOf('2026-11-22'), 7)
})

test('이번 주는 월요일부터 일요일까지 7일', () => {
  assert.deepEqual(thisWeekKeys(), [
    '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22',
  ])
})
