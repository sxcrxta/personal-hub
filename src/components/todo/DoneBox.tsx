// 완료함 — 끝낸 할 일. 처음엔 접혀 있고, 되살리거나 지울 수 있다
import { Archive, ChevronDown, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { todoActions } from '../../hooks/useTodos.ts'
import { fromUtc } from '../../lib/date.ts'
import type { Todo } from '../../types/data.ts'
import Checkbox from '../common/Checkbox.tsx'
import SubjectChip from '../common/SubjectChip.tsx'

export default function DoneBox({ todos }: { todos: Todo[] }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-lg border bg-surface-container-low">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-2 p-4 text-left">
        <Archive size={18} strokeWidth={1.75} className="text-icon" />
        <h2 className="text-headline-sm">완료함</h2>
        <span className="rounded-sm bg-surface-container px-1.5 text-label-md tabular-nums text-on-surface-variant">{todos.length}</span>
        <ChevronDown size={18} strokeWidth={1.75} className={`ml-auto text-icon transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-4">
          {todos.length === 0 && <p className="text-body-sm text-placeholder">아직 끝낸 할 일이 없어요.</p>}
          {todos.map((todo) => (
            <div key={todo.id} className="flex items-center gap-3 rounded border bg-surface-container-lowest px-4 py-3">
              <Checkbox checked onChange={() => todoActions.toggle(todo.id)} label={`${todo.title} 완료 취소`} />
              {todo.category && <SubjectChip name={todo.category} />}
              <span className="min-w-0 flex-1 truncate text-body-md text-placeholder line-through">{todo.title}</span>
              {todo.doneAt && (
                <span className="hidden text-body-sm text-on-surface-variant sm:inline">
                  {fromUtc(todo.doneAt).toFormat('M월 d일 HH:mm')} 완료
                </span>
              )}
              <button
                type="button"
                onClick={() => todoActions.toggle(todo.id)}
                aria-label="되살리기"
                title="되살리기"
                className="flex size-8 items-center justify-center rounded text-icon hover:bg-hover"
              >
                <RotateCcw size={16} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => todoActions.remove(todo.id)}
                aria-label="지우기"
                title="지우기"
                className="flex size-8 items-center justify-center rounded text-icon hover:bg-hover"
              >
                <Trash2 size={16} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
