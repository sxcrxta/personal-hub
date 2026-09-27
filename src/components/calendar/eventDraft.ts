// 일정 편집 칸에 넣을 값 — 저장된 일정(UTC)과 편집 칸(한국 날짜·시각 글자) 사이를 바꾼다
import { DateTime } from 'luxon'
import type { CalendarEvent, StudyRef } from '../../types/data.ts'
import { APP_ZONE, formatTime, fromDateAndTime, fromUtc, nextFullHour, toDateKey, toUtc } from '../../lib/date.ts'

export type EventDraft = {
  id?: string // 없으면 새 일정
  title: string
  category?: string
  date: string // yyyy-MM-dd
  startTime: string // HH:mm
  endTime: string // HH:mm
  location: string
  memo: string
  todoId?: string
  studyRef?: StudyRef
}

export function draftFromEvent(e: CalendarEvent): EventDraft {
  const start = fromUtc(e.start)
  const end = fromUtc(e.end)
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    date: toDateKey(start),
    startTime: formatTime(start),
    endTime: formatTime(end),
    location: e.location ?? '',
    memo: e.memo ?? '',
    todoId: e.todoId,
    studyRef: e.studyRef,
  }
}

/** 캘린더에서 고른 범위로 새 일정 만들기. 한 칸만 눌렀거나 종일 칸이면 1시간짜리로 */
export function draftFromRange(startStr: string, endStr: string, allDay: boolean): EventDraft {
  let start = DateTime.fromISO(startStr, { zone: APP_ZONE })
  let end = DateTime.fromISO(endStr, { zone: APP_ZONE })
  if (allDay) {
    start = start.set({ hour: 9 })
    end = start.plus({ hours: 1 })
  } else if (end.diff(start, 'minutes').minutes <= 30) {
    end = start.plus({ hours: 1 })
  }
  if (toDateKey(end) !== toDateKey(start)) end = start.endOf('day').set({ second: 0, millisecond: 0 })
  return blank(toDateKey(start), formatTime(start), formatTime(end))
}

/** '일정 추가' 버튼: 보고 있는 날(없으면 오늘)의 다음 정각부터 1시간 */
export function draftForNew(date?: string): EventDraft {
  const next = nextFullHour()
  const key = date ?? toDateKey(next)
  const start = fromDateAndTime(key, formatTime(next.hour >= 23 ? next.set({ hour: 9 }) : next))
  return blank(key, formatTime(start), formatTime(start.plus({ hours: 1 })))
}

function blank(date: string, startTime: string, endTime: string): EventDraft {
  return { title: '', date, startTime, endTime, location: '', memo: '' }
}

/** 시작 시각을 바꾸면 끝나는 시각을 1시간 뒤로 (자정을 넘기면 23:59) */
export function endAfterStart(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number)
  const minutes = Math.min(h * 60 + m + 60, 23 * 60 + 59)
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** 저장할 시작·끝(UTC). 끝이 시작보다 빠르면 오류 글자를 돌려준다 */
export function draftTimes(d: EventDraft): { start: string; end: string } | { error: string } {
  const start = fromDateAndTime(d.date, d.startTime)
  const end = fromDateAndTime(d.date, d.endTime)
  if (!start.isValid || !end.isValid) return { error: '날짜와 시각을 확인해 주세요' }
  if (end <= start) return { error: '끝나는 시각이 시작보다 늦어야 해요' }
  return { start: toUtc(start), end: toUtc(end) }
}
