// 할 일 화면(/todo) — 빠른 입력, 습관, 오늘 할 일, 목록별 할 일, 완료함. ?todo=id 로 들어오면 그 할 일을 연다
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import CategoryDialog from '../components/todo/CategoryDialog.tsx'
import DoneBox from '../components/todo/DoneBox.tsx'
import HabitBlock from '../components/todo/HabitBlock.tsx'
import ListManagerDialog from '../components/todo/ListManagerDialog.tsx'
import QuickAddBar from '../components/todo/QuickAddBar.tsx'
import TodaySection from '../components/todo/TodaySection.tsx'
import TodoEditor from '../components/todo/TodoEditor.tsx'
import TodoFilters, { ALL } from '../components/todo/TodoFilters.tsx'
import TodoItem from '../components/todo/TodoItem.tsx'
import { useStore } from '../hooks/useStore.ts'
import { DEFAULT_LIST_ID, useTodos } from '../hooks/useTodos.ts'
import { todoPrefsStore } from '../lib/stores.ts'
import { isPickedToday, sortTodos } from '../lib/todoRules.ts'

export default function TodoPage() {
  const { todos, lists, categories } = useTodos()
  const [prefs, setPrefs] = useStore(todoPrefsStore)
  const [params, setParams] = useSearchParams()
  const [listId, setListId] = useState(ALL)
  const [category, setCategory] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'lists' | 'categories' | null>(null)

  const editingId = params.get('todo')
  const editing = todos.find((t) => t.id === editingId && !t.parentId)
  const openEditor = (id: string) => setParams({ todo: id })
  const closeEditor = () => setParams({}, { replace: true })

  const topLevel = todos.filter((t) => !t.parentId)
  const listOf = (t: { listId?: string }) => t.listId ?? DEFAULT_LIST_ID
  const subtasksOf = (id: string) => todos.filter((t) => t.parentId === id)

  // 목록마다 남은 할 일 수
  const counts: Record<string, number> = { [ALL]: 0 }
  for (const t of topLevel.filter((t) => !t.done)) {
    counts[ALL] += 1
    counts[listOf(t)] = (counts[listOf(t)] ?? 0) + 1
  }

  const inView = topLevel.filter(
    (t) => (listId === ALL || listOf(t) === listId) && (category === null || t.category === category),
  )
  const today = sortTodos(topLevel.filter(isPickedToday), prefs.sort)
  const open = sortTodos(inView.filter((t) => !t.done && !isPickedToday(t)), prefs.sort)
  const done = inView.filter((t) => t.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''))

  return (
    <div className="flex flex-col gap-6">
      {/* 폰에서는 상단바에 화면 이름이 있어서 숨긴다 */}
      <header className="hidden items-baseline gap-3 md:flex">
        <h1 className="text-display-hero-mobile md:text-display-hero">할 일</h1>
        <p className="hidden text-body-md text-on-surface-variant md:block">학교 과제와 매일 하는 습관</p>
      </header>

      <QuickAddBar listId={listId === ALL ? DEFAULT_LIST_ID : listId} categories={categories} />
      <HabitBlock />
      <TodaySection todos={today} subtasksOf={subtasksOf} onOpen={openEditor} />

      <section className="flex flex-col gap-3">
        <TodoFilters
          lists={lists}
          listId={listId}
          onList={setListId}
          categories={categories}
          category={category}
          onCategory={setCategory}
          counts={counts}
          sort={prefs.sort}
          onSort={(sort) => setPrefs({ sort })}
          onManageLists={() => setDialog('lists')}
          onManageCategories={() => setDialog('categories')}
        />
        {open.length === 0 ? (
          <p className="rounded-lg border border-dashed py-10 text-center text-body-md text-placeholder">
            남은 할 일이 없어요. 위 입력칸에서 추가해 보세요.
          </p>
        ) : (
          open.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              subtasks={subtasksOf(todo.id)}
              list={listId === ALL ? lists.find((l) => l.id === listOf(todo)) : undefined}
              onOpen={openEditor}
            />
          ))
        )}
      </section>

      <DoneBox todos={done} />

      {editing && <TodoEditor key={editing.id} todo={editing} onClose={closeEditor} />}
      {dialog === 'lists' && <ListManagerDialog onClose={() => setDialog(null)} />}
      {dialog === 'categories' && <CategoryDialog onClose={() => setDialog(null)} />}
    </div>
  )
}
