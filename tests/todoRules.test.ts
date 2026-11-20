// 할 일 규칙 테스트 — 빠른 입력 풀기, 정렬, 오늘 할 일, 마감 표시
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TODAY, TOMORROW, YESTERDAY } from './clock.ts'
import type { Todo } from '../src/types/data.ts'
import { isPickedToday, parseQuickAdd, sortTodos, todoDue } from '../src/lib/todoRules.ts'

const todo = (fields: Partial<Todo>): Todo => ({ id: fields.title ?? 'x', title: 'x', done: false, ...fields })

test('빠른 입력: 카테고리·날짜·시각을 떼어 내고 나머지를 제목으로', () => {
  assert.deepEqual(parseQuickAdd('#수학 수특 15p 오답 !내일 @21:00'), {
    title: '수특 15p 오답',
    category: '수학',
    dueDate: TOMORROW,
    dueTime: '21:00',
  })
})

test('빠른 입력: 시각만 적으면 오늘 마감, 한 자리 시는 두 자리로', () => {
  assert.deepEqual(parseQuickAdd('영단어 @9:05'), { title: '영단어', category: undefined, dueDate: TODAY, dueTime: '09:05' })
})

test('빠른 입력: 모레, 표시가 없으면 제목만', () => {
  assert.equal(parseQuickAdd('보고서 !모레').dueDate, '2026-11-20')
  assert.deepEqual(parseQuickAdd('  그냥   할 일  '), { title: '그냥 할 일', category: undefined, dueDate: undefined, dueTime: undefined })
})

test('빠른 입력: 없는 시각(25:00, 9:75)은 마감으로 보지 않고 제목에 남긴다', () => {
  assert.deepEqual(parseQuickAdd('밤샘 @25:00'), { title: '밤샘 @25:00', category: undefined, dueDate: undefined, dueTime: undefined })
  assert.equal(parseQuickAdd('회의 @9:75').dueTime, undefined)
})

test('마감 임박순: 시각이 없으면 그날 끝으로 보고, 마감이 없으면 맨 뒤', () => {
  const list = [
    todo({ title: '마감 없음' }),
    todo({ title: '내일', dueDate: TOMORROW }),
    todo({ title: '오늘 밤', dueDate: TODAY }),
    todo({ title: '오늘 저녁', dueDate: TODAY, dueTime: '18:00' }),
  ]
  assert.deepEqual(sortTodos(list, 'due').map((t) => t.title), ['오늘 저녁', '오늘 밤', '내일', '마감 없음'])
})

test('이름순은 한글 가나다, 최근순은 만든 시각 거꾸로', () => {
  const list = [
    todo({ title: '다', createdAt: '2026-11-10T00:00:00Z' }),
    todo({ title: '가', createdAt: '2026-11-12T00:00:00Z' }),
    todo({ title: '나', createdAt: '2026-11-11T00:00:00Z' }),
  ]
  assert.deepEqual(sortTodos(list, 'name').map((t) => t.title), ['가', '나', '다'])
  assert.deepEqual(sortTodos(list, 'recent').map((t) => t.title), ['가', '나', '다'])
  // 원래 목록은 그대로 둔다
  assert.deepEqual(list.map((t) => t.title), ['다', '가', '나'])
})

test('오늘 할 일로 올린 것은 다음 날 저절로 내려간다', () => {
  assert.equal(isPickedToday(todo({ todayDate: TODAY })), true)
  assert.equal(isPickedToday(todo({ todayDate: YESTERDAY })), false)
  assert.equal(isPickedToday(todo({})), false)
})

test('마감 표시: 오늘·내일·어제·그 밖의 날', () => {
  assert.equal(todoDue(todo({})), null)
  assert.deepEqual(todoDue(todo({ dueDate: TODAY, dueTime: '21:00' })), { dday: 'D-Day', text: '오늘 21:00', days: 0 })
  assert.deepEqual(todoDue(todo({ dueDate: TOMORROW })), { dday: 'D-1', text: '내일', days: 1 })
  assert.deepEqual(todoDue(todo({ dueDate: YESTERDAY })), { dday: 'D+1', text: '어제', days: -1 })
  assert.equal(todoDue(todo({ dueDate: '2026-11-25' }))?.text, '11월 25일 (수)')
})
