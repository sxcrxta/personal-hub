// 할 일 규칙 — 빠른 입력 글자 풀기, 정렬, 구역(오늘 할 일 / 할 일 / 완료함) 나누기
import type { Todo } from '../types/data.ts'
import type { TodoSort } from './stores.ts'
import { dDayLabel, daysFromToday, formatDateKey, fromDateAndTime, shiftDateKey, todayKey } from './date.ts'

/**
 * 빠른 입력 풀기. 예: "#수학 수특 15p 오답 !내일 @21:00"
 * #이름 → 카테고리, !오늘 !내일 !모레 → 마감 날짜, @시:분 → 마감 시각
 */
export function parseQuickAdd(text: string): { title: string; category?: string; dueDate?: string; dueTime?: string } {
  let category: string | undefined
  let dueDate: string | undefined
  let dueTime: string | undefined
  const today = todayKey()

  const title = text
    .replace(/#(\S+)/g, (_, name: string) => {
      category = name
      return ''
    })
    .replace(/!(오늘|내일|모레)/g, (_, word: string) => {
      dueDate = shiftDateKey(today, word === '오늘' ? 0 : word === '내일' ? 1 : 2)
      return ''
    })
    .replace(/@(\d{1,2}):(\d{2})/g, (_, h: string, m: string) => {
      dueTime = `${h.padStart(2, '0')}:${m}`
      return ''
    })
    .replace(/\s+/g, ' ')
    .trim()

  if (dueTime && !dueDate) dueDate = today
  return { title, category, dueDate, dueTime }
}

export function sortTodos(todos: Todo[], sort: TodoSort): Todo[] {
  const copy = [...todos]
  if (sort === 'name') return copy.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  if (sort === 'recent') return copy.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  // 마감 임박순: 마감 없는 것은 맨 뒤
  const dueOf = (t: Todo) => (t.dueDate ? fromDateAndTime(t.dueDate, t.dueTime ?? '23:59').toMillis() : Infinity)
  return copy.sort((a, b) => dueOf(a) - dueOf(b))
}

/** 오늘 할 일로 올린 것인지 (다음 날이 되면 저절로 아니게 된다) */
export function isPickedToday(todo: Todo): boolean {
  return todo.todayDate === todayKey()
}

/** 할 일 마감 표시. 예: { dday: 'D-2', text: '9월 30일 (수) 21:00' } */
export function todoDue(todo: Todo): { dday: string; text: string; days: number } | null {
  if (!todo.dueDate) return null
  const due = fromDateAndTime(todo.dueDate, todo.dueTime)
  const days = daysFromToday(due)
  const day = days === 0 ? '오늘' : days === 1 ? '내일' : days === -1 ? '어제' : formatDateKey(todo.dueDate)
  return { dday: dDayLabel(days), text: todo.dueTime ? `${day} ${todo.dueTime}` : day, days }
}
