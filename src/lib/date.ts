// 날짜·시간 공용 함수 — 모든 화면은 날짜 계산을 여기서만 한다 (한국 시간 기준)
import { DateTime } from 'luxon'

export const APP_ZONE = 'Asia/Seoul'

/** 지금 시각을 한국 시간으로 */
export function now(): DateTime {
  return DateTime.now().setZone(APP_ZONE).setLocale('ko')
}

/** 'yyyy-MM-dd' 날짜를 한국 시간 자정으로 */
export function fromDateKey(key: string): DateTime {
  return DateTime.fromISO(key, { zone: APP_ZONE }).setLocale('ko')
}

/** 날짜 + 'HH:mm' 시각을 한국 시간으로. 시각이 없으면 그날 자정 */
export function fromDateAndTime(key: string, time?: string): DateTime {
  return time ? DateTime.fromISO(`${key}T${time}`, { zone: APP_ZONE }).setLocale('ko') : fromDateKey(key)
}

/** 저장된 UTC 문자열을 한국 시간으로 */
export function fromUtc(iso: string): DateTime {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(APP_ZONE).setLocale('ko')
}

/** 한국 시간을 저장용 UTC 문자열로 */
export function toUtc(dt: DateTime): string {
  return dt.toUTC().toISO()!
}

/** 한국 날짜를 'yyyy-MM-dd'로 */
export function toDateKey(dt: DateTime): string {
  return dt.setZone(APP_ZONE).toFormat('yyyy-MM-dd')
}

/** 오늘 날짜 'yyyy-MM-dd' */
export function todayKey(): string {
  return toDateKey(now())
}

/** 오늘부터 며칠 뒤인지 (날짜 기준, 어제면 -1) */
export function daysFromToday(dt: DateTime): number {
  const today = now().startOf('day')
  return Math.round(dt.setZone(APP_ZONE).startOf('day').diff(today, 'days').days)
}

/** D-Day 표시. 오늘이면 D-Day, 3일 뒤면 D-3, 어제면 D+1 */
export function dDayLabel(days: number): string {
  if (days === 0) return 'D-Day'
  return days > 0 ? `D-${days}` : `D+${-days}`
}

/** 상단바에 보여줄 오늘 날짜. 예: 2026년 9월 28일 월요일 */
export function todayLabel(): string {
  return now().toFormat('yyyy년 M월 d일 cccc')
}

/** 짧은 날짜. 예: 9월 28일 (월) */
export function formatMonthDay(dt: DateTime): string {
  return dt.setLocale('ko').toFormat('M월 d일 (ccc)')
}

/** 시각. 예: 18:00 */
export function formatTime(dt: DateTime): string {
  return dt.toFormat('HH:mm')
}

/** 'yyyy.MM.dd' 형식. 노트 작성일 등에 쓴다 */
export function formatDotDate(dt: DateTime): string {
  return dt.toFormat('yyyy.MM.dd')
}

/** 'yyyy-MM-dd'에서 며칠 더한 날짜 */
export function shiftDateKey(key: string, days: number): string {
  return toDateKey(fromDateKey(key).plus({ days }))
}

/** 요일 번호 1(월)~7(일) */
export function weekdayOf(key: string): number {
  return fromDateKey(key).weekday
}

/** 이번 주 월요일부터 일요일까지 날짜 7개 */
export function thisWeekKeys(): string[] {
  const monday = now().startOf('week')
  return Array.from({ length: 7 }, (_, i) => toDateKey(monday.plus({ days: i })))
}

/** 지금 이후의 가장 가까운 정각 (예: 14:20 → 15:00) */
export function nextFullHour(): DateTime {
  return now().plus({ hours: 1 }).startOf('hour')
}

/** '9월 28일 (월)' 형식으로 'yyyy-MM-dd'를 보여준다 */
export function formatDateKey(key: string): string {
  return formatMonthDay(fromDateKey(key))
}

export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
