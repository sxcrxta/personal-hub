// 할 일 알림 규칙 — 마감에 맞춘 알림 고르기, 마감을 옮기면 안 보낸 알림도 같이 옮기기, 미루기 시각, 알림 설명 글자
import type { DateTime } from 'luxon'
import type { Reminder, Todo } from '../types/data.ts'
import { daysFromToday, formatMonthDay, formatTime, fromDateAndTime, fromDateKey, fromUtc, now, toUtc } from './date.ts'

type Due = Pick<Todo, 'dueDate' | 'dueTime'>
export type ReminderChoice = { label: string; at: string } // at은 UTC ISO

/** 마감 시각에서 몇 분 전인지 → 이름. 고르기 목록과 설명 글자가 같은 이름을 쓴다 */
const BEFORE_DUE: [number, string][] = [
  [0, '마감 시각에'],
  [10, '마감 10분 전'],
  [60, '마감 1시간 전'],
  [24 * 60, '마감 하루 전'],
]

const minuteKey = (iso: string) => fromUtc(iso).startOf('minute').toMillis()

/** 알림 시각은 분 단위로 맞춘다 (발송 함수가 1분마다 돈다) */
function toChoice(label: string, at: DateTime): ReminderChoice {
  return { label, at: toUtc(at.startOf('minute')) }
}

/**
 * 마감에 맞춘 알림 후보. 시각이 있으면 마감 기준, 날짜만 있으면 당일 아침·전날 밤
 * 이미 지난 시각과 이미 걸어 둔 시각은 빼서 보여준다
 */
export function reminderChoices(due: Due, existing: Reminder[] = []): ReminderChoice[] {
  if (!due.dueDate) return []
  const choices = due.dueTime
    ? BEFORE_DUE.map(([min, label]) => toChoice(label, fromDateAndTime(due.dueDate!, due.dueTime).minus({ minutes: min })))
    : [
        toChoice('당일 오전 9시', fromDateAndTime(due.dueDate, '09:00')),
        toChoice('전날 오후 9시', fromDateAndTime(due.dueDate, '21:00').minus({ days: 1 })),
      ]
  const taken = new Set(existing.map((r) => minuteKey(r.at)))
  const current = now().toMillis()
  return choices.filter((c) => minuteKey(c.at) > current && !taken.has(minuteKey(c.at)))
}

/** 미루기: 지금부터 10분 뒤, 1시간 뒤, 내일 이 시각 */
export function snoozeChoices(): ReminderChoice[] {
  const t = now()
  return [toChoice('10분 뒤', t.plus({ minutes: 10 })), toChoice('1시간 뒤', t.plus({ hours: 1 })), toChoice('내일 이 시각', t.plus({ days: 1 }))]
}

/**
 * 미루기를 보여줄 때: 아직 안 끝낸 할 일에 알림 시각이 이미 지난 알림이 있을 때
 * 보냈는지(sentAt)는 웹이 처음 불러올 때의 값이라 늦을 수 있어서, 시각으로 판단한다
 */
export function canSnooze(todo: Todo): boolean {
  const current = now().toMillis()
  return !todo.done && (todo.reminders ?? []).some((r) => r.sentAt || fromUtc(r.at).toMillis() <= current)
}

/**
 * 마감을 옮기면 아직 안 보낸 알림도 같은 만큼 옮긴다. 보낸 알림은 기록이라 그대로 둔다
 * 둘 다 시각이 있으면 시각 차이만큼, 하나라도 날짜만 있으면 날짜 차이만큼 옮긴다 (예: 날짜만 있던 마감에 21:00을 넣어도 전날 밤 알림이 아침으로 가지 않게)
 * 마감이 없던 할 일이나 마감을 지운 할 일은 옮길 기준이 없어서 그대로 둔다
 */
export function shiftReminders(reminders: Reminder[], before: Due, after: Due): Reminder[] {
  if (!before.dueDate || !after.dueDate) return reminders
  const bothTimed = !!before.dueTime && !!after.dueTime
  const shift = (dt: DateTime): DateTime =>
    bothTimed
      ? dt.plus(fromDateAndTime(after.dueDate!, after.dueTime).diff(fromDateAndTime(before.dueDate!, before.dueTime)))
      : dt.plus({ days: Math.round(fromDateKey(after.dueDate!).diff(fromDateKey(before.dueDate!), 'days').days) })
  if (shift(now()).toMillis() === now().toMillis()) return reminders
  // 옮긴 알림은 새 번호로 다시 건다. 웹은 보낸 기록(sent_at)을 고치지 않으므로, 새 줄이어야 새 시각에 다시 온다
  return reminders.map((r) => (r.sentAt ? r : { id: crypto.randomUUID(), at: toUtc(shift(fromUtc(r.at))) }))
}

/** 시각 순서로, 같은 분의 알림은 하나만 */
export function sortReminders(reminders: Reminder[]): Reminder[] {
  const seen = new Set<number>()
  return [...reminders]
    .sort((a, b) => a.at.localeCompare(b.at))
    .filter((r) => {
      const key = minuteKey(r.at)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

/** 알림 한 줄 글자. 예: '오늘 20:50 · 마감 10분 전', '11월 25일 (수) 09:00', 보낸 것은 '· 보냄', 시각이 지난 것은 '· 지남' */
export function describeReminder(reminder: Reminder, due: Due): string {
  const at = fromUtc(reminder.at)
  const days = daysFromToday(at)
  const day = days === 0 ? '오늘' : days === 1 ? '내일' : days === -1 ? '어제' : formatMonthDay(at)
  const parts = [`${day} ${formatTime(at)}`]
  if (due.dueDate && due.dueTime) {
    const before = Math.round(fromDateAndTime(due.dueDate, due.dueTime).diff(at, 'minutes').minutes)
    const name = BEFORE_DUE.find(([min]) => min === before)?.[1]
    if (name) parts.push(name === '마감 시각에' ? '마감 시각' : name)
  }
  if (reminder.sentAt) parts.push('보냄')
  else if (at.toMillis() < now().startOf('minute').toMillis()) parts.push('지남')
  return parts.join(' · ')
}

/** 할 일 목록에 보여줄, 아직 안 온 알림 수 */
export function upcomingCount(todo: Todo): number {
  return (todo.reminders ?? []).filter((r) => !r.sentAt && fromUtc(r.at).toMillis() >= now().startOf('minute').toMillis()).length
}
