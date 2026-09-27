// 기한별 모아 보기 규칙 — 일정·할 일·공부 항목·시험·수행평가를 한 모양으로 모아 기한 지남/오늘/3일/7일로 나눈다
import type { DateTime } from 'luxon'
import type { Assignment, CalendarEvent, Exam, Todo } from '../types/data.ts'
import { daysFromToday, formatMonthDay, formatTime, fromDateAndTime, fromUtc } from './date.ts'

export type DueKind = 'event' | 'todo' | 'study' | 'exam' | 'assignment'

/** 체크했을 때 원래 데이터를 찾아가기 위한 위치 */
export type DueRef =
  | { kind: 'todo'; id: string }
  | { kind: 'assignment'; id: string }
  | { kind: 'study'; examId: string; subjectId: string; itemId: string }
  | { kind: 'event'; id: string }
  | { kind: 'exam'; id: string }

export type DueItem = {
  key: string
  kind: DueKind
  title: string
  subject?: string
  due: DateTime
  hasTime: boolean
  end?: DateTime // 일정의 끝나는 시각
  days: number // 오늘부터 며칠 뒤인지
  done?: boolean // 없으면 체크할 수 없는 항목(일정·시험)
  detail?: string
  ref: DueRef
}

export type DueBucket = 'overdue' | 'today' | 'soon' | 'week'

export const BUCKETS: { id: DueBucket; label: string }[] = [
  { id: 'overdue', label: '기한 지남' },
  { id: 'today', label: '오늘' },
  { id: 'soon', label: '3일 이내' },
  { id: 'week', label: '7일 이내' },
]

/** 며칠 남았는지로 칸을 정한다. 7일보다 멀면 보여주지 않는다 */
export function bucketOf(days: number): DueBucket | null {
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 3) return 'soon'
  if (days <= 7) return 'week'
  return null
}

type Sources = {
  events: CalendarEvent[]
  todos: Todo[]
  exams: Exam[]
  assignments: Assignment[]
}

/** 여러 데이터를 기한이 있는 항목 목록 하나로 모은다 */
export function collectDueItems({ events, todos, exams, assignments }: Sources): DueItem[] {
  const items: DueItem[] = []

  for (const e of events) {
    if (e.todoId || e.studyRef) continue // 연결된 할 일·공부 항목이 따로 보이므로 겹치지 않게
    const start = fromUtc(e.start)
    items.push({
      key: `event-${e.id}`,
      kind: 'event',
      title: e.title,
      subject: e.category,
      due: start,
      hasTime: true,
      end: fromUtc(e.end),
      days: daysFromToday(start),
      detail: e.location,
      ref: { kind: 'event', id: e.id },
    })
  }

  for (const t of todos) {
    if (!t.dueDate || t.parentId) continue // 마감이 없거나 하위 할 일이면 빼고
    const due = fromDateAndTime(t.dueDate, t.dueTime)
    items.push({
      key: `todo-${t.id}`,
      kind: 'todo',
      title: t.title,
      subject: t.category,
      due,
      hasTime: !!t.dueTime,
      days: daysFromToday(due),
      done: t.done,
      ref: { kind: 'todo', id: t.id },
    })
  }

  for (const exam of exams) {
    const start = fromDateAndTime(exam.startDate)
    items.push({
      key: `exam-${exam.id}`,
      kind: 'exam',
      title: exam.name,
      due: start,
      hasTime: false,
      days: daysFromToday(start),
      detail: '시험 첫날',
      ref: { kind: 'exam', id: exam.id },
    })

    for (const subject of exam.subjects) {
      for (const item of subject.items) {
        if (!item.planDate) continue
        const due = fromDateAndTime(item.planDate)
        items.push({
          key: `study-${item.id}`,
          kind: 'study',
          title: item.title,
          subject: subject.name,
          due,
          hasTime: false,
          days: daysFromToday(due),
          done: item.done,
          detail: exam.name,
          ref: { kind: 'study', examId: exam.id, subjectId: subject.id, itemId: item.id },
        })
      }
    }
  }

  for (const a of assignments) {
    const due = fromDateAndTime(a.dueDate, a.dueTime)
    const doneSteps = a.steps.filter((s) => s.done).length
    items.push({
      key: `assignment-${a.id}`,
      kind: 'assignment',
      title: a.title,
      subject: a.subject,
      due,
      hasTime: !!a.dueTime,
      days: daysFromToday(due),
      done: a.done,
      detail: a.steps.length ? `준비 ${doneSteps}/${a.steps.length}` : undefined,
      ref: { kind: 'assignment', id: a.id },
    })
  }

  return items
}

/** 네 칸으로 나눈다. 기한 지난 칸에는 아직 안 끝낸 것만, 일정·시험은 지난 것을 넣지 않는다 */
export function groupByBucket(items: DueItem[]): Record<DueBucket, DueItem[]> {
  const groups: Record<DueBucket, DueItem[]> = { overdue: [], today: [], soon: [], week: [] }

  for (const item of items) {
    const bucket = bucketOf(item.days)
    if (!bucket) continue
    if (bucket === 'overdue' && (item.done ?? true)) continue
    groups[bucket].push(item)
  }

  for (const list of Object.values(groups)) {
    // 시각이 없는 항목은 그날의 끝으로 보고 뒤에 둔다
    list.sort((a, b) => sortTime(a) - sortTime(b))
  }
  return groups
}

function sortTime(item: DueItem): number {
  return (item.hasTime ? item.due : item.due.endOf('day')).toMillis()
}

/** 아직 챙겨야 하는(안 끝낸) 항목 수 */
export function countPending(groups: Record<DueBucket, DueItem[]>): number {
  return Object.values(groups)
    .flat()
    .filter((item) => item.done === false).length
}

/** 항목 아래에 보여줄 기한 글자. 예: 오늘 21:00까지, 내일, 9월 30일 (수) 19:00–21:00 */
export function dueText(item: DueItem): string {
  const day =
    item.days === 0 ? '오늘' : item.days === 1 ? '내일' : item.days === -1 ? '어제' : formatMonthDay(item.due)
  if (item.kind === 'event' && item.end) return `${day} ${formatTime(item.due)}–${formatTime(item.end)}`
  if (!item.hasTime) return day
  return `${day} ${formatTime(item.due)}${item.days < 0 ? ' 마감' : '까지'}`
}
