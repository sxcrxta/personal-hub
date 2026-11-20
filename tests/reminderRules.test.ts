// 할 일 알림 규칙 테스트 — 알림 고르기, 마감 옮기면 같이 옮기기, 미루기, 설명 글자 (지금은 11/18 10:00)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TODAY, TOMORROW } from './clock.ts'
import type { Reminder, Todo } from '../src/types/data.ts'
import { canSnooze, describeReminder, reminderChoices, shiftReminders, snoozeChoices, sortReminders, upcomingCount } from '../src/lib/reminderRules.ts'
import { fromDateAndTime, fromUtc, toUtc } from '../src/lib/date.ts'

/** 한국 시간 'yyyy-MM-dd HH:mm' → 저장용 UTC */
const kst = (text: string) => toUtc(fromDateAndTime(text.slice(0, 10), text.slice(11)))
/** UTC → 한국 시간 'yyyy-MM-dd HH:mm' */
const show = (iso: string) => fromUtc(iso).toFormat('yyyy-MM-dd HH:mm')
const rem = (text: string, sent = false): Reminder => ({ id: text, at: kst(text), ...(sent ? { sentAt: kst(text) } : {}) })

test('마감 시각이 있으면 마감 기준으로 고르고, 이미 지난 시각은 뺀다', () => {
  const choices = reminderChoices({ dueDate: TOMORROW, dueTime: '21:00' })
  assert.deepEqual(choices.map((c) => [c.label, show(c.at)]), [
    ['마감 시각에', '2026-11-19 21:00'],
    ['마감 10분 전', '2026-11-19 20:50'],
    ['마감 1시간 전', '2026-11-19 20:00'],
    ['마감 하루 전', '2026-11-18 21:00'],
  ])
  // 오늘 10:30 마감이면 하루 전·1시간 전은 이미 지났다
  assert.deepEqual(reminderChoices({ dueDate: TODAY, dueTime: '10:30' }).map((c) => c.label), ['마감 시각에', '마감 10분 전'])
})

test('날짜만 있으면 당일 아침 9시와 전날 밤 9시, 마감이 없으면 고를 것이 없다', () => {
  assert.deepEqual(reminderChoices({ dueDate: '2026-11-20' }).map((c) => [c.label, show(c.at)]), [
    ['당일 오전 9시', '2026-11-20 09:00'],
    ['전날 오후 9시', '2026-11-19 21:00'],
  ])
  assert.deepEqual(reminderChoices({}), [])
})

test('이미 걸어 둔 시각은 다시 고를 수 없다', () => {
  const choices = reminderChoices({ dueDate: TOMORROW, dueTime: '21:00' }, [rem('2026-11-19 20:50')])
  assert.ok(!choices.some((c) => c.label === '마감 10분 전'))
  assert.equal(choices.length, 3)
})

test('마감 시각을 옮기면 안 보낸 알림만 같은 만큼 옮긴다', () => {
  const reminders = [rem('2026-11-19 20:50'), rem('2026-11-18 09:00', true)]
  const moved = shiftReminders(reminders, { dueDate: TOMORROW, dueTime: '21:00' }, { dueDate: '2026-11-20', dueTime: '22:00' })
  assert.equal(show(moved[0].at), '2026-11-20 21:50')
  assert.notEqual(moved[0].id, reminders[0].id) // 옮긴 알림은 새 번호로 다시 건다
  assert.equal(moved[1], reminders[1]) // 보낸 알림은 그대로
})

test('날짜만 있던 마감에 시각을 넣으면 날짜 차이만큼만 옮긴다', () => {
  const reminders = [rem('2026-11-19 21:00')] // 11/20 마감의 전날 밤 알림
  assert.equal(show(shiftReminders(reminders, { dueDate: '2026-11-20' }, { dueDate: '2026-11-20', dueTime: '21:00' })[0].at), '2026-11-19 21:00')
  assert.equal(show(shiftReminders(reminders, { dueDate: '2026-11-20' }, { dueDate: '2026-11-22', dueTime: '08:00' })[0].at), '2026-11-21 21:00')
})

test('마감이 그대로거나, 없던 마감을 넣거나 지우면 알림은 그대로', () => {
  const reminders = [rem('2026-11-19 20:50')]
  assert.equal(shiftReminders(reminders, { dueDate: TOMORROW, dueTime: '21:00' }, { dueDate: TOMORROW, dueTime: '21:00' }), reminders)
  assert.equal(shiftReminders(reminders, {}, { dueDate: TOMORROW }), reminders)
  assert.equal(shiftReminders(reminders, { dueDate: TOMORROW }, {}), reminders)
})

test('미루기는 지금부터 10분 뒤, 1시간 뒤, 내일 이 시각', () => {
  assert.deepEqual(snoozeChoices().map((c) => [c.label, show(c.at)]), [
    ['10분 뒤', '2026-11-18 10:10'],
    ['1시간 뒤', '2026-11-18 11:00'],
    ['내일 이 시각', '2026-11-19 10:00'],
  ])
})

test('미루기는 안 끝낸 할 일에 알림 시각이 지난 뒤에만', () => {
  const todo = (fields: Partial<Todo>): Todo => ({ id: 't', title: 't', done: false, ...fields })
  assert.equal(canSnooze(todo({ reminders: [rem('2026-11-18 09:00', true)] })), true)
  assert.equal(canSnooze(todo({ reminders: [rem('2026-11-18 09:00', true)], done: true })), false)
  assert.equal(canSnooze(todo({ reminders: [rem('2026-11-18 09:59')] })), true) // 보낸 기록을 아직 못 받았어도
  assert.equal(canSnooze(todo({ reminders: [rem('2026-11-19 09:00')] })), false)
  assert.equal(canSnooze(todo({})), false)
})

test('설명 글자: 마감과의 관계, 보냄, 지남', () => {
  const due = { dueDate: TOMORROW, dueTime: '21:00' }
  assert.equal(describeReminder(rem('2026-11-19 20:50'), due), '내일 20:50 · 마감 10분 전')
  assert.equal(describeReminder(rem('2026-11-19 21:00'), due), '내일 21:00 · 마감 시각')
  assert.equal(describeReminder(rem('2026-11-18 21:00'), due), '오늘 21:00 · 마감 하루 전')
  assert.equal(describeReminder(rem('2026-11-19 07:00'), due), '내일 07:00')
  assert.equal(describeReminder(rem('2026-11-18 09:00', true), {}), '오늘 09:00 · 보냄')
  assert.equal(describeReminder(rem('2026-11-18 09:00'), {}), '오늘 09:00 · 지남')
  assert.equal(describeReminder(rem('2026-11-25 09:00'), {}), '11월 25일 (수) 09:00')
})

test('정렬하면서 같은 분 알림은 하나만, 앞으로 올 알림 수', () => {
  const reminders = [rem('2026-11-19 09:00'), rem('2026-11-18 09:00', true), { ...rem('2026-11-19 09:00'), id: 'dup' }]
  assert.deepEqual(sortReminders(reminders).map((r) => show(r.at)), ['2026-11-18 09:00', '2026-11-19 09:00'])
  assert.equal(upcomingCount({ id: 't', title: 't', done: false, reminders }), 2)
})
