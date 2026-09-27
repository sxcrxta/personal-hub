// 오늘 할 일 구역 — 목록에서 해(☀) 버튼으로 골라 올린 것. 다음 날이 되면 저절로 비워진다
import { Pin, X } from 'lucide-react'
import { todoActions } from '../../hooks/useTodos.ts'
import { todoDue } from '../../lib/todoRules.ts'
import type { Todo } from '../../types/data.ts'
import Checkbox from '../common/Checkbox.tsx'
import SubjectChip from '../common/SubjectChip.tsx'
import DueChip from './DueChip.tsx'

type Props = {
  todos: Todo[]
  subtasksOf: (id: string) => Todo[]
  onOpen: (id: string) => void
}

export default function TodaySection({ todos, subtasksOf, onOpen }: Props) {
  const done = todos.filter((t) => t.done).length

  return (
    <section className="rounded-lg border bg-surface-container-lowest p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin size={18} strokeWidth={1.75} className="text-icon" />
          <h2 className="text-headline-sm">오늘 할 일</h2>
        </div>
        <span className="text-body-sm text-on-surface-variant tabular-nums">
          {done}/{todos.length} 완료
        </span>
      </div>

      {todos.length === 0 ? (
        <p className="mt-4 text-body-md text-on-surface-variant">아래 목록에서 ☀ 버튼을 눌러 오늘 끝낼 일을 골라 올려 보세요.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {todos.map((todo) => {
            const subs = subtasksOf(todo.id)
            const due = todoDue(todo)
            const progress = subs.length ? subs.filter((s) => s.done).length / subs.length : todo.done ? 1 : 0
            return (
              <article key={todo.id} className="flex flex-col rounded-md border bg-background p-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={todo.done} onChange={() => todoActions.toggle(todo.id)} label={`${todo.title} 완료`} />
                  {todo.category && <SubjectChip name={todo.category} />}
                  <button
                    type="button"
                    onClick={() => todoActions.toggleToday(todo.id)}
                    aria-label="오늘 할 일에서 내리기"
                    className="ml-auto flex size-7 items-center justify-center rounded text-placeholder hover:bg-hover"
                  >
                    <X size={15} strokeWidth={1.75} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(todo.id)}
                  className={`mt-2 text-left text-body-lg ${todo.done ? 'text-placeholder line-through' : ''}`}
                >
                  {todo.title}
                </button>
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                    {due ? <DueChip {...due} /> : <span>마감 없음</span>}
                    {subs.length > 0 && (
                      <span className="tabular-nums">
                        진행 {subs.filter((s) => s.done).length}/{subs.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-primary-container" style={{ width: `${progress * 100}%` }} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
