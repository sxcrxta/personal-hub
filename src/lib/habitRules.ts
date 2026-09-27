// 습관 규칙 — 연속 기록 계산. 하는 요일이 아닌 날은 건너뛰고 센다
import type { Habit } from '../types/data.ts'
import { shiftDateKey, todayKey, weekdayOf } from './date.ts'

/** 오늘(아직 안 했으면 어제)부터 거꾸로, 하는 요일에 빠짐없이 체크한 날 수 */
export function streakOf(habit: Habit): number {
  const done = new Set(habit.logs)
  let key = todayKey()
  if (!done.has(key)) key = shiftDateKey(key, -1) // 오늘은 아직 기회가 있으니 어제부터 센다
  let streak = 0
  for (let i = 0; i < 366; i++) {
    if (habit.days.includes(weekdayOf(key))) {
      if (!done.has(key)) break
      streak += 1
    }
    key = shiftDateKey(key, -1)
  }
  return streak
}
