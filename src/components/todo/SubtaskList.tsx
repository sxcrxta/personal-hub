// 하위 할 일 목록 — 한 단계만. 체크, 추가, 지우기
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { todoActions } from '../../hooks/useTodos.ts'
import type { Todo } from '../../types/data.ts'
import Checkbox from '../common/Checkbox.tsx'

type Props = {
  parentId: string
  subtasks: Todo[]
}

export default function SubtaskList({ parentId, subtasks }: Props) {
  const [text, setText] = useState('')

  function add() {
    if (!text.trim()) return
    todoActions.addSubtask(parentId, text.trim())
    setText('')
  }

  return (
    <div className="space-y-1.5">
      {subtasks.map((sub) => (
        <div key={sub.id} className="group flex items-center gap-2.5">
          <Checkbox checked={sub.done} onChange={() => todoActions.toggle(sub.id)} label={`${sub.title} 완료`} />
          <span className={`flex-1 text-body-md ${sub.done ? 'text-placeholder line-through' : ''}`}>{sub.title}</span>
          <button
            type="button"
            onClick={() => todoActions.remove(sub.id)}
            aria-label={`${sub.title} 지우기`}
            className="flex size-6 items-center justify-center rounded text-placeholder opacity-0 group-hover:opacity-100 hover:bg-hover focus:opacity-100"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2.5">
        <Plus size={18} strokeWidth={1.75} className="text-placeholder" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
          onBlur={add}
          placeholder="하위 할 일 추가"
          className="h-7 flex-1 bg-transparent text-body-md placeholder:text-placeholder focus:outline-none"
        />
      </div>
    </div>
  )
}
