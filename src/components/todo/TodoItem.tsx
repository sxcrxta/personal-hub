// 할 일 카드 하나 — 체크, 카테고리·마감, 하위 할 일 펼치기, 오늘 할 일로 올리기, 캘린더 배치, 지우기
import { CalendarPlus, ChevronDown, ListChecks, Sun, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { usePlaceOnCalendar } from '../../hooks/usePlaceOnCalendar.ts'
import { todoActions } from '../../hooks/useTodos.ts'
import { isPickedToday, todoDue } from '../../lib/todoRules.ts'
import type { Todo, TodoList } from '../../types/data.ts'
import Checkbox from '../common/Checkbox.tsx'
import SubjectChip from '../common/SubjectChip.tsx'
import DueChip from './DueChip.tsx'
import SubtaskList from './SubtaskList.tsx'

type Props = {
  todo: Todo
  subtasks: Todo[]
  list?: TodoList
  onOpen: (id: string) => void
}

export default function TodoItem({ todo, subtasks, list, onOpen }: Props) {
  const [open, setOpen] = useState(false)
  const placeOnCalendar = usePlaceOnCalendar()
  const due = todoDue(todo)
  const doneSubs = subtasks.filter((s) => s.done).length
  const picked = isPickedToday(todo)

  return (
    <article className="rounded-lg border bg-surface-container-lowest p-4 shadow-card">
      <div className="flex gap-3">
        <div className="pt-1">
          <Checkbox checked={todo.done} onChange={() => todoActions.toggle(todo.id)} label={`${todo.title} 완료`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {todo.category && <SubjectChip name={todo.category} />}
            {due && <DueChip {...due} />}
            {list && (
              <span className="text-body-sm text-on-surface-variant">
                {list.emoji} {list.name}
              </span>
            )}
          </div>
          <button type="button" onClick={() => onOpen(todo.id)} className="mt-1.5 block text-left text-body-lg font-medium hover:underline">
            {todo.title}
          </button>
          {todo.memo && <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">{todo.memo}</p>}

          {/* 하위 할 일 */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface"
          >
            <ListChecks size={14} strokeWidth={1.75} />
            {subtasks.length ? `하위 할 일 ${doneSubs}/${subtasks.length}` : '하위 할 일 추가'}
            <ChevronDown size={14} strokeWidth={1.75} className={open ? 'rotate-180' : ''} />
          </button>
          {open && (
            <div className="mt-2 rounded border bg-surface-container-low p-3">
              <SubtaskList parentId={todo.id} subtasks={subtasks} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-start gap-0.5">
          <IconButton label={picked ? '오늘 할 일에서 내리기' : '오늘 할 일로 올리기'} active={picked} onClick={() => todoActions.toggleToday(todo.id)}>
            <Sun size={17} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="캘린더에 배치" onClick={() => placeOnCalendar(todo.id)}>
            <CalendarPlus size={17} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="지우기" onClick={() => todoActions.remove(todo.id)}>
            <Trash2 size={17} strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>
    </article>
  )
}

function IconButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex size-8 items-center justify-center rounded transition-colors ${
        active ? 'bg-social-bg text-due-soon' : 'text-icon hover:bg-hover'
      }`}
    >
      {children}
    </button>
  )
}
