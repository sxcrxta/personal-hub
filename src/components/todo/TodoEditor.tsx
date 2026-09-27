// 할 일 편집 창 — 폰에서는 아래에서 올라오는 시트. 제목·목록·카테고리·마감·메모·하위 할 일
import { CalendarPlus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePlaceOnCalendar } from '../../hooks/usePlaceOnCalendar.ts'
import { DEFAULT_LIST_ID, todoActions, useTodos } from '../../hooks/useTodos.ts'
import { showToast } from '../../lib/toast.ts'
import type { Todo } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import Dialog from '../common/Dialog.tsx'
import { Field, Select, TextArea, TextInput } from '../common/Field.tsx'
import SubtaskList from './SubtaskList.tsx'

type Props = {
  todo: Todo
  onClose: () => void
}

export default function TodoEditor({ todo, onClose }: Props) {
  const { todos, lists, categories } = useTodos()
  const [draft, setDraft] = useState(todo)
  const placeOnCalendar = usePlaceOnCalendar()
  const subtasks = todos.filter((t) => t.parentId === todo.id)
  const set = (patch: Partial<Todo>) => setDraft((d) => ({ ...d, ...patch }))

  function save() {
    todoActions.update(todo.id, {
      title: draft.title.trim() || todo.title,
      listId: draft.listId,
      category: draft.category || undefined,
      dueDate: draft.dueDate || undefined,
      dueTime: draft.dueDate ? draft.dueTime || undefined : undefined,
      memo: draft.memo?.trim() || undefined,
    })
    showToast('할 일을 고쳤어요')
    onClose()
  }

  return (
    <Dialog open onClose={onClose} title="할 일">
      <div className="flex flex-col gap-4">
        <Field label="제목">
          <TextInput value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="목록">
            <Select value={draft.listId ?? DEFAULT_LIST_ID} onChange={(e) => set({ listId: e.target.value })}>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.emoji} {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="카테고리">
            <Select value={draft.category ?? ''} onChange={(e) => set({ category: e.target.value })}>
              <option value="">없음</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="마감 날짜">
            <TextInput type="date" value={draft.dueDate ?? ''} onChange={(e) => set({ dueDate: e.target.value })} />
          </Field>
          <Field label="마감 시각">
            <TextInput
              type="time"
              value={draft.dueTime ?? ''}
              disabled={!draft.dueDate}
              onChange={(e) => set({ dueTime: e.target.value })}
            />
          </Field>
        </div>
        <Field label="메모">
          <TextArea rows={3} value={draft.memo ?? ''} onChange={(e) => set({ memo: e.target.value })} />
        </Field>
        <div>
          <span className="mb-1.5 block text-label-md text-on-surface-variant">하위 할 일</span>
          <div className="rounded border bg-surface-container-low p-3">
            <SubtaskList parentId={todo.id} subtasks={subtasks} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button
            variant="danger"
            onClick={() => {
              todoActions.remove(todo.id)
              onClose()
            }}
          >
            <Trash2 size={16} strokeWidth={1.75} />
            삭제
          </Button>
          <Button
            onClick={() => {
              save()
              placeOnCalendar(todo.id)
            }}
          >
            <CalendarPlus size={16} strokeWidth={1.75} />
            캘린더 배치
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" onClick={save}>
              저장
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
