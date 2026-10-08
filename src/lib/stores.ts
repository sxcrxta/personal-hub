// 앱의 모든 데이터 저장소 목록 — 키 이름과 처음 값을 한곳에서 정한다
import type { Assignment, CalendarEvent, Exam, Habit, Memo, Note, Todo, TodoList, VaultNote } from '../types/data.ts'
import {
  sampleAssignments,
  sampleEvents,
  sampleExams,
  sampleHabits,
  sampleMemos,
  sampleNotes,
  sampleTodoLists,
  sampleTodos,
  sampleVaultNotes,
} from './sampleData.ts'
import { createStore } from './storage.ts'

/** 할 일 정렬 방식: 마감 임박순 / 최근 추가순 / 이름순 */
export type TodoSort = 'due' | 'recent' | 'name'

export const eventsStore = createStore<CalendarEvent[]>('events', sampleEvents)
export const todosStore = createStore<Todo[]>('todos', sampleTodos)
export const todoListsStore = createStore<TodoList[]>('todo-lists', sampleTodoLists)
export const categoriesStore = createStore<string[]>('categories', () => ['국어', '수학', '영어', '과학', '동아리', '일상'])
export const todoPrefsStore = createStore<{ sort: TodoSort }>('todo-prefs', () => ({ sort: 'due' }))
export const habitsStore = createStore<Habit[]>('habits', sampleHabits)
export const examsStore = createStore<Exam[]>('exams', sampleExams)
export const assignmentsStore = createStore<Assignment[]>('assignments', sampleAssignments)
export const memosStore = createStore<Memo[]>('memos', sampleMemos)
export const notesStore = createStore<Note[]>('notes', sampleNotes)

/** 맥북 워커가 마지막으로 신호를 보낸 시각 (7회차에 워커가 적는다. 지금은 늘 비어 있다) */
export const workerStore = createStore<{ lastSeenAt: string | null }>('worker', () => ({ lastSeenAt: null }))

export const vaultNotesStore = createStore<VaultNote[]>('vault-notes', sampleVaultNotes)

/** 오늘 보여줄 예전 노트. 날짜가 바뀌면 새로 고른다 */
export const todayNoteStore = createStore<{ date: string; noteId: string } | null>('today-note', () => null)

/** 시작 안내를 닫았는지 */
export const onboardingStore = createStore<{ dismissed: boolean }>('onboarding', () => ({ dismissed: false }))
