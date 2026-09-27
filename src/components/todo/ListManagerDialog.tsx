// 할 일 목록 관리 창 — 목록 추가, 이름·이모지 바꾸기, 지우기(안의 할 일은 기본 목록으로)
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_LIST_ID, listActions, useTodos } from '../../hooks/useTodos.ts'
import { emojiOf } from '../../lib/nameStyle.ts'
import Button from '../common/Button.tsx'
import Dialog from '../common/Dialog.tsx'
import EmojiPicker from '../common/EmojiPicker.tsx'
import { TextInput } from '../common/Field.tsx'

export default function ListManagerDialog({ onClose }: { onClose: () => void }) {
  const { lists } = useTodos()
  const [name, setName] = useState('')

  function add() {
    if (!name.trim()) return
    listActions.add(name.trim(), emojiOf(name))
    setName('')
  }

  return (
    <Dialog open onClose={onClose} title="목록 관리">
      <div className="space-y-2">
        {lists.map((list) => (
          <div key={list.id} className="flex items-center gap-2">
            <EmojiPicker value={list.emoji} onChange={(emoji) => listActions.update(list.id, { emoji })} />
            <TextInput value={list.name} onChange={(e) => listActions.update(list.id, { name: e.target.value })} />
            <button
              type="button"
              disabled={list.id === DEFAULT_LIST_ID}
              onClick={() => listActions.remove(list.id)}
              aria-label={`${list.name} 목록 지우기`}
              title={list.id === DEFAULT_LIST_ID ? '기본 목록은 지울 수 없어요' : '지우기'}
              className="flex size-[38px] shrink-0 items-center justify-center rounded text-icon hover:bg-hover disabled:opacity-30"
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2 border-t pt-4">
        <TextInput
          value={name}
          placeholder="새 목록 이름 (이모지는 자동)"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
        />
        <Button variant="primary" onClick={add} disabled={!name.trim()}>
          추가
        </Button>
      </div>
      <p className="mt-3 text-body-sm text-on-surface-variant">목록을 지우면 그 안의 할 일은 기본 목록으로 옮겨져요.</p>
    </Dialog>
  )
}
