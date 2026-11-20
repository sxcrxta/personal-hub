// 오늘 화면의 기한별 모아 보기 테스트 — 여러 데이터를 모아 기한 지남/오늘/3일/7일 칸으로 나누기
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TODAY, TOMORROW, YESTERDAY } from './clock.ts'
import { bucketOf, collectDueItems, countPending, dueText, groupByBucket } from '../src/lib/due.ts'

test('칸 나누기 경계: 3일까지 3일 이내, 7일까지 7일 이내, 그보다 멀면 안 보임', () => {
  assert.equal(bucketOf(-1), 'overdue')
  assert.equal(bucketOf(0), 'today')
  assert.equal(bucketOf(1), 'soon')
  assert.equal(bucketOf(3), 'soon')
  assert.equal(bucketOf(4), 'week')
  assert.equal(bucketOf(7), 'week')
  assert.equal(bucketOf(8), null)
})

const sources = {
  events: [
    { id: 'e1', title: '동아리', start: '2026-11-18T09:00:00Z', end: '2026-11-18T10:00:00Z' }, // 오늘 18:00–19:00
    { id: 'e2', title: '할 일과 연결', start: '2026-11-18T01:00:00Z', end: '2026-11-18T02:00:00Z', todoId: 't1' },
    { id: 'e3', title: '지난 일정', start: '2026-11-17T01:00:00Z', end: '2026-11-17T02:00:00Z' },
  ],
  todos: [
    { id: 't1', title: '오늘 저녁 할 일', done: false, dueDate: TODAY, dueTime: '17:00' },
    { id: 't2', title: '오늘 안 끝난 일', done: false, dueDate: TODAY },
    { id: 't3', title: '어제 못 한 일', done: false, dueDate: YESTERDAY },
    { id: 't4', title: '어제 끝낸 일', done: true, dueDate: YESTERDAY },
    { id: 't5', title: '하위 할 일', done: false, dueDate: TODAY, parentId: 't1' },
    { id: 't6', title: '마감 없음', done: false },
  ],
  exams: [
    {
      id: 'x1', name: '기말', startDate: '2026-11-24', endDate: '2026-11-26',
      subjects: [{ id: 's1', name: '수학', examDate: '2026-11-24', items: [{ id: 'i1', title: '오답', done: false, planDate: TOMORROW }] }],
    },
  ],
  assignments: [
    { id: 'a1', title: '보고서', subject: '화학', dueDate: '2026-11-21', done: false, steps: [{ id: 'p1', title: '실험', done: true }, { id: 'p2', title: '쓰기', done: false }] },
  ],
}

test('모으기: 연결된 일정·하위 할 일·마감 없는 할 일은 빼고 모은다', () => {
  const keys = collectDueItems(sources).map((i) => i.key).sort()
  assert.deepEqual(keys, [
    'assignment-a1', 'event-e1', 'event-e3', 'exam-x1', 'study-i1', 'todo-t1', 'todo-t2', 'todo-t3', 'todo-t4',
  ])
})

test('칸 나누기: 기한 지남에는 안 끝낸 것만, 지난 일정은 넣지 않는다. 시각 없는 항목은 그날 끝으로', () => {
  const groups = groupByBucket(collectDueItems(sources))
  assert.deepEqual(groups.overdue.map((i) => i.key), ['todo-t3'])
  assert.deepEqual(groups.today.map((i) => i.key), ['todo-t1', 'event-e1', 'todo-t2'])
  assert.deepEqual(groups.soon.map((i) => i.key), ['study-i1', 'assignment-a1'])
  assert.deepEqual(groups.week.map((i) => i.key), ['exam-x1'])
  // 체크할 수 있는 것 중 안 끝낸 것: t3, t1, t2, i1, a1 (일정·시험은 세지 않는다)
  assert.equal(countPending(groups), 5)
})

test('수행평가에는 준비 단계 진행이 붙는다', () => {
  const a = collectDueItems(sources).find((i) => i.key === 'assignment-a1')
  assert.equal(a?.detail, '준비 1/2')
})

test('기한 글자: 일정은 시작–끝, 시각 있는 할 일은 까지/마감', () => {
  const items = collectDueItems(sources)
  const text = (key: string) => dueText(items.find((i) => i.key === key)!)
  assert.equal(text('event-e1'), '오늘 18:00–19:00')
  assert.equal(text('todo-t1'), '오늘 17:00까지')
  assert.equal(text('todo-t2'), '오늘')
  assert.equal(text('todo-t3'), '어제')
  assert.equal(text('assignment-a1'), '11월 21일 (토)')
})
