// 카테고리 관리 창 — 추가하고 지운다. 색은 이름에 맞춰 자동으로 붙는다
import { X } from 'lucide-react'
import { useState } from 'react'
import { categoryActions, useTodos } from '../../hooks/useTodos.ts'
import Button from '../common/Button.tsx'
import Dialog from '../common/Dialog.tsx'
import { TextInput } from '../common/Field.tsx'
import SubjectChip from '../common/SubjectChip.tsx'

export default function CategoryDialog({ onClose }: { onClose: () => void }) {
  const { categories } = useTodos()
  const [name, setName] = useState('')

  function add() {
    categoryActions.add(name)
    setName('')
  }

  return (
    <Dialog open onClose={onClose} title="카테고리 관리">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span key={c} className="flex items-center gap-0.5">
            <SubjectChip name={c} />
            <button
              type="button"
              onClick={() => categoryActions.remove(c)}
              aria-label={`${c} 지우기`}
              className="flex size-6 items-center justify-center rounded-full text-placeholder hover:bg-hover"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2 border-t pt-4">
        <TextInput
          value={name}
          placeholder="새 카테고리 (예: 한국사)"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
        />
        <Button variant="primary" onClick={add} disabled={!name.trim()}>
          추가
        </Button>
      </div>
      <p className="mt-3 text-body-sm text-on-surface-variant">카테고리를 지워도 할 일은 남고, 카테고리만 빠져요.</p>
    </Dialog>
  )
}
