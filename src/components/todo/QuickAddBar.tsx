// 할 일 빠른 입력 — "#수학 수특 15p !내일 @21:00"처럼 한 줄로 카테고리·마감까지 넣는다
import { CornerDownLeft, Zap } from 'lucide-react'
import { useState } from 'react'
import { categoryActions, todoActions } from '../../hooks/useTodos.ts'
import { parseQuickAdd } from '../../lib/todoRules.ts'
import { showToast } from '../../lib/toast.ts'
import Button from '../common/Button.tsx'

type Props = {
  listId: string
  categories: string[]
}

export default function QuickAddBar({ listId, categories }: Props) {
  const [text, setText] = useState('')

  function add() {
    const parsed = parseQuickAdd(text)
    if (!parsed.title) return
    if (parsed.category) categoryActions.add(parsed.category)
    todoActions.add({ ...parsed, listId })
    setText('')
    showToast('할 일을 추가했어요')
  }

  // 빠른 태그 누르면 입력칸 끝에 붙인다
  const append = (token: string) => setText((t) => (t.trim() ? `${t.trim()} ${token} ` : `${token} `))

  return (
    <section className="rounded-lg border bg-surface-container-lowest p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Zap size={18} strokeWidth={1.75} className="shrink-0 text-icon" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
          placeholder="할 일을 입력하세요 (예: #수학 수특 15p 오답 !내일)"
          className="h-10 min-w-0 flex-1 bg-transparent text-body-lg placeholder:text-placeholder focus:outline-none"
        />
        <Button variant="primary" onClick={add} disabled={!text.trim()}>
          추가 <CornerDownLeft size={14} strokeWidth={2} />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
        <span className="mr-1 text-body-sm text-on-surface-variant">빠른 태그</span>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => append(`#${c}`)}
            className="h-7 rounded-full border border-field-border px-2.5 text-label-md text-on-surface-variant hover:bg-hover-soft"
          >
            #{c}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-outline-variant" />
        {['!오늘', '!내일'].map((token) => (
          <button
            key={token}
            type="button"
            onClick={() => append(token)}
            className="h-7 rounded-full border border-field-border px-2.5 text-label-md text-on-surface-variant hover:bg-hover-soft"
          >
            {token}
          </button>
        ))}
        <span className="ml-auto hidden text-body-sm text-placeholder md:inline">@21:00 처럼 쓰면 마감 시각</span>
      </div>
    </section>
  )
}
