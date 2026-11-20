// 학업 규칙 테스트 — 진도율, 시험 D-Day와 시험 중, 공부 항목 날짜, 수행평가를 급한 정도로 나누기
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TODAY, TOMORROW, YESTERDAY } from './clock.ts'
import type { Assignment, Exam } from '../src/types/data.ts'
import { assignmentDue, assignmentGroup, examDday, examProgress, planLabel, progressOf, splitExams } from '../src/lib/studyRules.ts'

const exam = (id: string, startDate: string, endDate: string): Exam => ({ id, name: id, startDate, endDate, subjects: [] })
const assignment = (dueDate: string, fields: Partial<Assignment> = {}): Assignment => ({
  id: dueDate, title: '보고서', subject: '화학', dueDate, done: false, steps: [], ...fields,
})

test('진도율은 반올림한 퍼센트, 항목이 없으면 0%', () => {
  assert.deepEqual(progressOf([]), { done: 0, total: 0, percent: 0 })
  const items = [{ id: '1', title: 'a', done: true }, { id: '2', title: 'b', done: false }, { id: '3', title: 'c', done: false }]
  assert.deepEqual(progressOf(items), { done: 1, total: 3, percent: 33 })
})

test('시험 진도율은 모든 과목의 항목을 합쳐서', () => {
  const e: Exam = {
    ...exam('기말', '2026-12-01', '2026-12-04'),
    subjects: [
      { id: 's1', name: '수학', examDate: '2026-12-01', items: [{ id: '1', title: 'a', done: true }] },
      { id: 's2', name: '영어', examDate: '2026-12-02', items: [{ id: '2', title: 'b', done: false }] },
    ],
  }
  assert.equal(examProgress(e).percent, 50)
})

test('시험 D-Day: 시작 전, 시험 기간 중, 끝난 뒤', () => {
  assert.deepEqual(examDday(exam('a', '2026-11-22', '2026-11-25')), { days: 4, label: 'D-4', during: false })
  assert.deepEqual(examDday(exam('b', YESTERDAY, TOMORROW)), { days: -1, label: '시험 중', during: true })
  assert.deepEqual(examDday(exam('c', '2026-11-10', YESTERDAY)), { days: -8, label: 'D+8', during: false })
})

test('지금 시험은 가까운 순, 지난 시험은 최근 순. 오늘 끝나는 시험은 아직 지금 시험', () => {
  const { current, past } = splitExams([
    exam('먼 시험', '2026-12-10', '2026-12-12'),
    exam('오늘 끝', '2026-11-16', TODAY),
    exam('오래전', '2026-09-01', '2026-09-03'),
    exam('지난주', '2026-11-09', '2026-11-11'),
  ])
  assert.deepEqual(current.map((e) => e.id), ['오늘 끝', '먼 시험'])
  assert.deepEqual(past.map((e) => e.id), ['지난주', '오래전'])
})

test('공부 항목 날짜: 오늘 공부, 밀림, 끝낸 지난 항목, 앞으로', () => {
  assert.equal(planLabel({ id: '1', title: 'a', done: false }), null)
  assert.deepEqual(planLabel({ id: '1', title: 'a', done: false, planDate: TODAY }), { text: '오늘 공부', tone: 'today' })
  assert.deepEqual(planLabel({ id: '1', title: 'a', done: false, planDate: '2026-11-16' }), { text: '2일 밀림', tone: 'late' })
  assert.deepEqual(planLabel({ id: '1', title: 'a', done: true, planDate: '2026-11-16' }), { text: '11월 16일 (월)', tone: 'later' })
  assert.deepEqual(planLabel({ id: '1', title: 'a', done: false, planDate: TOMORROW }), { text: '11월 19일 (목)', tone: 'later' })
})

test('수행평가 나누기: 내일까지(지난 것 포함) 급함, 7일 이내, 그 뒤, 제출 완료', () => {
  assert.equal(assignmentGroup(assignment(YESTERDAY)), 'urgent')
  assert.equal(assignmentGroup(assignment(TOMORROW)), 'urgent')
  assert.equal(assignmentGroup(assignment('2026-11-20')), 'soon')
  assert.equal(assignmentGroup(assignment('2026-11-25')), 'soon')
  assert.equal(assignmentGroup(assignment('2026-11-26')), 'later')
  assert.equal(assignmentGroup(assignment(YESTERDAY, { done: true })), 'done')
})

test('수행평가 마감 글자', () => {
  assert.deepEqual(assignmentDue(assignment(TODAY, { dueTime: '23:59' })), { dday: 'D-Day', text: '오늘 23:59 마감', days: 0 })
  assert.equal(assignmentDue(assignment(TOMORROW)).text, '내일 마감')
})
