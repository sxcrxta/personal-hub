// 습관 읽고 쓰기 — 추가·수정·지우기(되돌리기), 날짜별 체크
import type { Habit } from '../types/data.ts'
import { newId, type Store } from '../lib/storage.ts'
import { habitsStore } from '../lib/stores.ts'
import { withUndo } from './undo.ts'
import { useStore } from './useStore.ts'

export function useHabits() {
  const [habits] = useStore(habitsStore)
  return habits
}

export const habitActions = {
  add(habit: Omit<Habit, 'id' | 'logs'>) {
    habitsStore.set((prev) => [...prev, { ...habit, id: newId(), logs: [] }])
  },
  update(id: string, patch: Partial<Habit>) {
    habitsStore.set((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  },
  remove(id: string) {
    withUndo('습관을 지웠어요', [habitsStore as Store<unknown>], () => {
      habitsStore.set((prev) => prev.filter((h) => h.id !== id))
    })
  },
  toggleDay(id: string, dateKey: string) {
    habitsStore.set((prev) =>
      prev.map((h) =>
        h.id !== id
          ? h
          : { ...h, logs: h.logs.includes(dateKey) ? h.logs.filter((d) => d !== dateKey) : [...h.logs, dateKey] },
      ),
    )
  },
}
