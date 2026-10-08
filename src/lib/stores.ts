// 앱의 모든 데이터 저장소 목록 — 저장소마다 어떤 Supabase 표에 어떻게 나뉘어 들어가는지 한곳에서 정한다
// 적힌 순서가 DB에 보내는 순서다. 다른 표를 가리키는 저장소는 가리켜지는 저장소보다 아래에 둔다
// 화면 타입(camelCase, 선택 값은 undefined)과 표의 열(snake_case, 비어 있으면 null)을 여기서만 바꿔 준다
import type { Assignment, CalendarEvent, Exam, Habit, Memo, Note, Todo, TodoList, VaultNote } from '../types/data.ts'
import { createStore } from './storage.ts'
import { supabase } from './supabase.ts'
import { createSyncedStore, hhmm, n, selectAll, startSync, u, type Row } from './sync.ts'

export { onboardingStore, todoPrefsStore, type TodoSort } from './profile.ts'
export { dataStatusStore } from './sync.ts'

/** 기본 목록. DB에는 줄이 없고, 할 일의 list_id가 비어 있으면 기본 목록에 있는 것이다 */
const INBOX: TodoList = { id: 'inbox', name: '할 일', emoji: '📥' }

const DEFAULT_CATEGORIES = ['국어', '수학', '영어', '과학', '동아리', '일상']

// ───────── 할 일 ─────────

export const todoListsStore = createSyncedStore<TodoList[]>('todo-lists', {
  empty: () => [INBOX],
  async load() {
    const rows = await selectAll('todo_lists')
    return [INBOX, ...rows.map((r) => ({ id: r.id as string, name: r.name as string, emoji: r.emoji as string }))]
  },
  tables: [{ name: 'todo_lists' }],
  toRows: (lists) => ({
    todo_lists: lists.filter((l) => l.id !== INBOX.id).map((l) => ({ id: l.id, name: l.name, emoji: l.emoji })),
  }),
})

export const todosStore = createSyncedStore<Todo[]>('todos', {
  empty: () => [],
  async load() {
    const rows = await selectAll('todos')
    return rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      done: r.done as boolean,
      listId: u(r.list_id as string | null),
      category: u(r.category as string | null),
      memo: u(r.memo as string | null),
      dueDate: u(r.due_date as string | null),
      dueTime: hhmm(r.due_time as string | null),
      parentId: u(r.parent_id as string | null),
      todayDate: u(r.today_date as string | null),
      createdAt: r.created_at as string,
      doneAt: u(r.done_at as string | null),
    }))
  },
  tables: [{ name: 'todos' }],
  toRows: (todos) => ({
    todos: todos.map((t) => ({
      id: t.id,
      title: t.title,
      done: t.done,
      list_id: t.listId === INBOX.id ? null : n(t.listId),
      category: n(t.category),
      memo: n(t.memo),
      due_date: n(t.dueDate),
      due_time: n(t.dueTime),
      parent_id: n(t.parentId),
      today_date: n(t.todayDate),
      ...(t.createdAt ? { created_at: t.createdAt } : {}),
      done_at: n(t.doneAt),
    })),
  }),
})

export const categoriesStore = createSyncedStore<string[]>('categories', {
  empty: () => [],
  async load() {
    const rows = await selectAll('categories')
    if (rows.length) return rows.map((r) => r.name as string)
    // 처음 쓰는 계정이면 기본 카테고리를 넣어 둔다
    const { error } = await supabase.from('categories').insert(DEFAULT_CATEGORIES.map((name) => ({ name })))
    if (error) throw error
    return DEFAULT_CATEGORIES
  },
  tables: [{ name: 'categories', key: ['name'], onConflict: 'user_id,name' }],
  toRows: (names) => ({ categories: names.map((name) => ({ name })) }),
})

// ───────── 습관 ─────────

export const habitsStore = createSyncedStore<Habit[]>('habits', {
  empty: () => [],
  async load() {
    const [habits, logs] = await Promise.all([selectAll('habits'), selectAll('habit_logs')])
    return habits.map((h) => ({
      id: h.id as string,
      name: h.name as string,
      emoji: h.emoji as string,
      days: h.days as number[],
      alarmTime: hhmm(h.alarm_time as string | null),
      logs: logs.filter((l) => l.habit_id === h.id).map((l) => l.log_date as string),
    }))
  },
  tables: [{ name: 'habits' }, { name: 'habit_logs', key: ['habit_id', 'log_date'], onConflict: 'habit_id,log_date' }],
  toRows: (habits) => ({
    habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, days: h.days, alarm_time: n(h.alarmTime) })),
    habit_logs: habits.flatMap((h) => h.logs.map((d) => ({ habit_id: h.id, log_date: d }))),
  }),
})

// ───────── 학업 ─────────

export const examsStore = createSyncedStore<Exam[]>('exams', {
  empty: () => [],
  async load() {
    const [exams, subjects, items] = await Promise.all([
      selectAll('exams'),
      selectAll('exam_subjects'),
      selectAll('study_items'),
    ])
    return exams.map((e) => ({
      id: e.id as string,
      name: e.name as string,
      startDate: e.start_date as string,
      endDate: e.end_date as string,
      subjects: subjects
        .filter((s) => s.exam_id === e.id)
        .map((s) => ({
          id: s.id as string,
          name: s.name as string,
          emoji: u(s.emoji as string | null),
          examDate: s.exam_date as string,
          items: items
            .filter((i) => i.subject_id === s.id)
            .map((i) => ({
              id: i.id as string,
              title: i.title as string,
              done: i.done as boolean,
              planDate: u(i.plan_date as string | null),
            })),
        })),
    }))
  },
  tables: [{ name: 'exams' }, { name: 'exam_subjects' }, { name: 'study_items' }],
  toRows: (exams) => ({
    exams: exams.map((e) => ({ id: e.id, name: e.name, start_date: e.startDate, end_date: e.endDate })),
    exam_subjects: exams.flatMap((e) =>
      e.subjects.map((s) => ({ id: s.id, exam_id: e.id, name: s.name, emoji: n(s.emoji), exam_date: s.examDate })),
    ),
    study_items: exams.flatMap((e) =>
      e.subjects.flatMap((s) =>
        s.items.map((i) => ({ id: i.id, subject_id: s.id, title: i.title, done: i.done, plan_date: n(i.planDate) })),
      ),
    ),
  }),
})

export const assignmentsStore = createSyncedStore<Assignment[]>('assignments', {
  empty: () => [],
  async load() {
    const [assignments, steps] = await Promise.all([selectAll('assignments'), selectAll('assignment_steps')])
    return assignments.map((a) => ({
      id: a.id as string,
      title: a.title as string,
      subject: a.subject as string,
      dueDate: a.due_date as string,
      dueTime: hhmm(a.due_time as string | null),
      memo: u(a.memo as string | null),
      done: a.done as boolean,
      steps: steps
        .filter((s) => s.assignment_id === a.id)
        .sort((x, y) => (x.position as number) - (y.position as number))
        .map((s) => ({ id: s.id as string, title: s.title as string, done: s.done as boolean })),
    }))
  },
  tables: [{ name: 'assignments' }, { name: 'assignment_steps' }],
  toRows: (assignments) => ({
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject,
      due_date: a.dueDate,
      due_time: n(a.dueTime),
      memo: n(a.memo),
      done: a.done,
    })),
    assignment_steps: assignments.flatMap((a) =>
      a.steps.map((s, position) => ({ id: s.id, assignment_id: a.id, title: s.title, done: s.done, position })),
    ),
  }),
})

// ───────── 일정 ─────────
// 할 일·공부 항목을 가리키므로 그 저장소들보다 아래에 만든다 (sync.ts는 만든 순서대로 DB에 보낸다)

export const eventsStore = createSyncedStore<CalendarEvent[]>('events', {
  empty: () => [],
  async load() {
    // 공부 항목과 연결된 일정은 그 항목의 과목·시험 id까지 같이 읽어 studyRef를 만든다
    const rows = await selectAll('events', '*, study_items(subject_id, exam_subjects(exam_id))')
    return rows.map((r) => {
      const item = r.study_items as { subject_id: string; exam_subjects: { exam_id: string } } | null
      return {
        id: r.id as string,
        title: r.title as string,
        start: r.start_at as string,
        end: r.end_at as string,
        location: u(r.location as string | null),
        category: u(r.category as string | null),
        memo: u(r.memo as string | null),
        todoId: u(r.todo_id as string | null),
        studyRef:
          item && r.study_item_id
            ? { examId: item.exam_subjects.exam_id, subjectId: item.subject_id, itemId: r.study_item_id as string }
            : undefined,
      }
    })
  },
  tables: [{ name: 'events' }],
  toRows: (events) => ({
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      start_at: e.start,
      end_at: e.end,
      location: n(e.location),
      category: n(e.category),
      memo: n(e.memo),
      todo_id: n(e.todoId),
      study_item_id: n(e.studyRef?.itemId),
    })),
  }),
})

// ───────── 메모 ─────────

/** 메모 줄을 화면 값으로. 새 메모를 넣은 뒤에도 쓴다 */
export function memoFromRow(r: Row): Memo {
  return {
    id: r.id as number,
    content: r.content as string,
    tags: r.tags as string[],
    saveMode: r.save_mode as Memo['saveMode'],
    status: r.status as Memo['status'],
    targetFolder: r.target_folder as string,
    notePath: u(r.note_path as string | null),
    errorMessage: u(r.error_message as string | null),
    createdAt: r.created_at as string,
  }
}

// 새 메모는 번호를 DB가 정해야 해서 useMemos의 memoActions.save가 직접 넣는다.
// 여기서는 웹이 고칠 수 있는 열(다시 시도할 때의 상태 등)만 보낸다. 파일 경로·가져간 기기 같은 맥북 프로그램의 칸은 건드리지 않는다
export const memosStore = createSyncedStore<Memo[]>('memos', {
  empty: () => [],
  load: async () => (await selectAll('memos')).map(memoFromRow),
  tables: [{ name: 'memos' }],
  toRows: (memos) => ({
    memos: memos.map((m) => ({
      id: m.id,
      content: m.content,
      tags: m.tags,
      save_mode: m.saveMode,
      status: m.status,
      target_folder: m.targetFolder,
      error_message: n(m.errorMessage),
    })),
  }),
})

export const notesStore = createSyncedStore<Note[]>('notes', {
  empty: () => [],
  async load() {
    const rows = await selectAll('notes')
    // 최근에 고친 것이 위로
    return rows
      .map((r) => ({ id: r.id as string, title: r.title as string, body: r.body as string, updatedAt: r.updated_at as string }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  tables: [{ name: 'notes' }],
  // updated_at은 DB가 저절로 고친다
  toRows: (notes) => ({ notes: notes.map((x) => ({ id: x.id, title: x.title, body: x.body })) }),
})

// ───────── 오늘 ─────────

/** 워커가 볼트에서 골라 올린 예전 노트 (웹은 읽기만 한다) */
export const vaultNotesStore = createSyncedStore<VaultNote[]>('vault-notes', {
  empty: () => [],
  async load() {
    const rows = await selectAll('vault_notes')
    return rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      path: r.path as string,
      tags: r.tags as string[],
      createdAt: (r.note_date as string | null) ?? (r.created_at as string).slice(0, 10),
      content: r.content as string,
    }))
  },
})

/** 오늘 보여줄 예전 노트. 날짜가 바뀌면 새로 고른다. 지난 날의 기록은 남겨 둔다 */
export const todayNoteStore = createSyncedStore<{ date: string; noteId: string } | null>('today-note', {
  empty: () => null,
  async load() {
    const { data, error } = await supabase
      .from('daily_notes')
      .select('note_date, vault_note_id')
      .order('note_date', { ascending: false })
      .limit(1)
    if (error) throw error
    const row = data?.[0]
    return row ? { date: row.note_date as string, noteId: row.vault_note_id as string } : null
  },
  tables: [{ name: 'daily_notes', key: ['note_date'], onConflict: 'user_id,note_date', keepDeleted: true }],
  toRows: (pick) => ({ daily_notes: pick ? [{ note_date: pick.date, vault_note_id: pick.noteId }] : [] }),
})

// ───────── 브라우저에만 두는 것 ─────────

/** 맥북 워커가 마지막으로 신호를 보낸 시각 (7회차에 worker_devices 표로 옮긴다. 지금은 늘 비어 있다) */
export const workerStore = createStore<{ lastSeenAt: string | null }>('worker', () => ({ lastSeenAt: null }))

// 저장소를 다 만든 뒤에 로그인 상태를 따라 불러오기 시작한다
startSync()
