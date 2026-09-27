// 할 일 읽고 쓰기 — 추가, 체크, 하위 할 일, 오늘 할 일로 올리기, 캘린더 배치, 지우기(되돌리기)
import type { Todo } from '../types/data.ts'
import { fromDateAndTime, nextFullHour, now, todayKey, toUtc } from '../lib/date.ts'
import { newId, type Store } from '../lib/storage.ts'
import { categoriesStore, eventsStore, todoListsStore, todosStore } from '../lib/stores.ts'
import { withUndo } from './undo.ts'
import { useStore } from './useStore.ts'

export const DEFAULT_LIST_ID = 'inbox'

export function useTodos() {
  const [todos] = useStore(todosStore)
  const [lists] = useStore(todoListsStore)
  const [categories] = useStore(categoriesStore)
  return { todos, lists, categories }
}

export const todoActions = {
  add(todo: Omit<Todo, 'id' | 'done' | 'createdAt'>): string {
    const id = newId()
    todosStore.set((prev) => [...prev, { ...todo, id, done: false, createdAt: toUtc(now()) }])
    return id
  },

  update(id: string, patch: Partial<Todo>) {
    todosStore.set((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    // 제목이 바뀌면 연결된 일정도 같이
    if (patch.title !== undefined) {
      const title = patch.title
      eventsStore.set((prev) => prev.map((e) => (e.todoId === id ? { ...e, title } : e)))
    }
  },

  toggle(id: string) {
    todosStore.set((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done, doneAt: t.done ? undefined : toUtc(now()) } : t)),
    )
  },

  /** 오늘 할 일로 올리기 / 내리기 */
  toggleToday(id: string) {
    const today = todayKey()
    todosStore.set((prev) =>
      prev.map((t) => (t.id === id ? { ...t, todayDate: t.todayDate === today ? undefined : today } : t)),
    )
  },

  addSubtask(parentId: string, title: string) {
    const id = newId()
    todosStore.set((prev) => [...prev, { id, title, done: false, parentId, createdAt: toUtc(now()) }])
  },

  /** 지우기 — 하위 할 일도 같이 지우고, 연결된 일정은 남기되 연결만 끊는다 */
  remove(id: string) {
    const isSubtask = !!todosStore.get().find((t) => t.id === id)?.parentId
    withUndo(isSubtask ? '하위 할 일을 지웠어요' : '할 일을 지웠어요', [todosStore, eventsStore] as Store<unknown>[], () => {
      todosStore.set((prev) => prev.filter((t) => t.id !== id && t.parentId !== id))
      eventsStore.set((prev) => prev.map((e) => (e.todoId === id ? { ...e, todoId: undefined } : e)))
    })
  },

  /** 캘린더에 배치: 이미 있으면 그 일정 id를, 없으면 마감 시각(없으면 다음 정각)에 1시간짜리 일정을 만든다 */
  placeOnCalendar(id: string): string | undefined {
    const existing = eventsStore.get().find((e) => e.todoId === id)
    if (existing) return existing.id
    const todo = todosStore.get().find((t) => t.id === id)
    if (!todo) return
    const start =
      todo.dueDate && todo.dueTime
        ? fromDateAndTime(todo.dueDate, todo.dueTime).minus({ hours: 1 })
        : todo.dueDate
          ? fromDateAndTime(todo.dueDate, '19:00')
          : nextFullHour()
    const eventId = newId()
    eventsStore.set((prev) => [
      ...prev,
      {
        id: eventId,
        title: todo.title,
        start: toUtc(start),
        end: toUtc(start.plus({ hours: 1 })),
        category: todo.category,
        todoId: todo.id,
      },
    ])
    return eventId
  },
}

export const listActions = {
  add(name: string, emoji: string) {
    todoListsStore.set((prev) => [...prev, { id: newId(), name, emoji }])
  },
  update(id: string, patch: { name?: string; emoji?: string }) {
    todoListsStore.set((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  },
  /** 목록을 지우면 그 안의 할 일은 기본 목록으로 옮긴다 */
  remove(id: string) {
    if (id === DEFAULT_LIST_ID) return
    withUndo('목록을 지웠어요', [todoListsStore, todosStore] as Store<unknown>[], () => {
      todoListsStore.set((prev) => prev.filter((l) => l.id !== id))
      todosStore.set((prev) => prev.map((t) => (t.listId === id ? { ...t, listId: DEFAULT_LIST_ID } : t)))
    })
  },
}

export const categoryActions = {
  add(name: string) {
    const clean = name.trim().replace(/^#/, '')
    if (!clean) return
    categoriesStore.set((prev) => (prev.includes(clean) ? prev : [...prev, clean]))
  },
  /** 카테고리를 지워도 할 일은 남는다. 할 일에서 그 카테고리만 빠진다 */
  remove(name: string) {
    withUndo(`'${name}' 카테고리를 지웠어요`, [categoriesStore, todosStore] as Store<unknown>[], () => {
      categoriesStore.set((prev) => prev.filter((c) => c !== name))
      todosStore.set((prev) => prev.map((t) => (t.category === name ? { ...t, category: undefined } : t)))
    })
  },
}
