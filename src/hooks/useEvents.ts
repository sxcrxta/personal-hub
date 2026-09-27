// 일정 읽고 쓰기 — 연결된 할 일·공부 항목과 제목을 같이 바꾸고, 일정에서 할 일을 만든다
import type { CalendarEvent, StudyRef } from '../types/data.ts'
import { fromUtc, formatTime, toDateKey } from '../lib/date.ts'
import { newId, type Store } from '../lib/storage.ts'
import { eventsStore, examsStore, todosStore } from '../lib/stores.ts'
import { withUndo } from './undo.ts'
import { useStore } from './useStore.ts'

export function useEvents() {
  const [events] = useStore(eventsStore)
  return events
}

/** 공부 항목 제목 바꾸기 (일정 ↔ 공부 항목 동기화에 쓴다) */
export function renameStudyItem(ref: StudyRef, title: string) {
  examsStore.set((prev) =>
    prev.map((exam) =>
      exam.id !== ref.examId
        ? exam
        : {
            ...exam,
            subjects: exam.subjects.map((s) =>
              s.id !== ref.subjectId ? s : { ...s, items: s.items.map((i) => (i.id === ref.itemId ? { ...i, title } : i)) },
            ),
          },
    ),
  )
}

export const eventActions = {
  add(event: Omit<CalendarEvent, 'id'>): string {
    const id = newId()
    eventsStore.set((prev) => [...prev, { ...event, id }])
    return id
  },

  update(id: string, patch: Partial<CalendarEvent>) {
    const before = eventsStore.get().find((e) => e.id === id)
    eventsStore.set((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    // 제목이 바뀌면 연결된 할 일·공부 항목도 같이
    if (before && patch.title !== undefined && patch.title !== before.title) {
      const title = patch.title
      if (before.todoId) todosStore.set((prev) => prev.map((t) => (t.id === before.todoId ? { ...t, title } : t)))
      if (before.studyRef) renameStudyItem(before.studyRef, title)
    }
  },

  remove(id: string) {
    withUndo('일정을 지웠어요', [eventsStore as Store<unknown>], () => {
      eventsStore.set((prev) => prev.filter((e) => e.id !== id))
    })
  },

  /** 일정에서 할 일 만들기: 일정 날짜·시각을 마감으로 하고 서로 연결한다 */
  createTodo(id: string): string | undefined {
    const event = eventsStore.get().find((e) => e.id === id)
    if (!event) return
    const start = fromUtc(event.start)
    const todoId = newId()
    todosStore.set((prev) => [
      ...prev,
      {
        id: todoId,
        title: event.title,
        done: false,
        category: event.category,
        dueDate: toDateKey(start),
        dueTime: formatTime(start),
        createdAt: new Date().toISOString(),
      },
    ])
    eventsStore.set((prev) => prev.map((e) => (e.id === id ? { ...e, todoId } : e)))
    return todoId
  },
}
