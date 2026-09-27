// 캘린더에 그릴 것 모으기 — 일정, 캘린더에 올린 할 일·공부 항목, 수행평가 마감, 시험일을 구별되는 모양으로
import type { EventInput } from '@fullcalendar/core'
import { useMemo } from 'react'
import { paletteOf } from '../lib/subjectColor.ts'
import { assignmentsStore, eventsStore, examsStore } from '../lib/stores.ts'
import { useStore } from './useStore.ts'

/** 캘린더 블록 종류: 일반 일정 / 할 일 / 공부 / 수행평가 마감 / 시험 */
export type CalendarKind = 'event' | 'todo' | 'study' | 'deadline' | 'exam'

export const KIND_LABEL: Record<CalendarKind, string> = {
  event: '일정',
  todo: '할 일',
  study: '공부',
  deadline: '마감',
  exam: '시험',
}

export function useCalendarItems(): EventInput[] {
  const [events] = useStore(eventsStore)
  const [assignments] = useStore(assignmentsStore)
  const [exams] = useStore(examsStore)

  return useMemo(() => {
    const items: EventInput[] = []

    for (const e of events) {
      const kind: CalendarKind = e.studyRef ? 'study' : e.todoId ? 'todo' : 'event'
      items.push({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        classNames: ['ev', `ev-${kind}`, e.category ? `pal-${paletteOf(e.category)}` : 'pal-none'],
        extendedProps: { kind, location: e.location },
      })
    }

    for (const a of assignments) {
      if (a.done) continue
      items.push({
        id: `deadline-${a.id}`,
        title: `${a.subject} · ${a.title}`,
        start: a.dueDate,
        allDay: true,
        editable: false,
        classNames: ['ev', 'ev-deadline'],
        extendedProps: { kind: 'deadline' satisfies CalendarKind, assignmentId: a.id },
      })
    }

    for (const exam of exams) {
      for (const s of exam.subjects) {
        items.push({
          id: `exam-${s.id}`,
          title: `${s.emoji ?? ''} ${s.name} 시험`.trim(),
          start: s.examDate,
          allDay: true,
          editable: false,
          classNames: ['ev', 'ev-exam'],
          extendedProps: { kind: 'exam' satisfies CalendarKind, examId: exam.id },
        })
      }
    }
    return items
  }, [events, assignments, exams])
}
