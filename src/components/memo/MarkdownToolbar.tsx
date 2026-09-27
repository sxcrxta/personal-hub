// 마크다운 도구 막대 — 고른 글자를 굵게·기울임·목록·체크·링크·코드로 감싼다. 결과는 마크다운 원문 그대로
import { Bold, Code, Eye, Italic, Link, List, ListChecks, Pencil } from 'lucide-react'
import type { RefObject } from 'react'

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
  preview: boolean
  onTogglePreview: () => void
}

type Action = { label: string; icon: typeof Bold; before: string; after?: string; line?: boolean }

const ACTIONS: Action[] = [
  { label: '굵게', icon: Bold, before: '**', after: '**' },
  { label: '기울임', icon: Italic, before: '*', after: '*' },
  { label: '목록', icon: List, before: '- ', line: true },
  { label: '체크리스트', icon: ListChecks, before: '- [ ] ', line: true },
  { label: '링크', icon: Link, before: '[[', after: ']]' },
  { label: '코드', icon: Code, before: '`', after: '`' },
]

export default function MarkdownToolbar({ textareaRef, value, onChange, preview, onTogglePreview }: Props) {
  function apply({ before, after = '', line }: Action) {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    let next: string
    let cursor: number
    if (line) {
      // 줄 맨 앞에 붙인다
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      next = value.slice(0, lineStart) + before + value.slice(lineStart)
      cursor = end + before.length
    } else {
      next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end)
      cursor = end + before.length
    }
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className="flex items-center gap-0.5 border-y bg-surface-container-low px-2 py-1.5">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          disabled={preview}
          onClick={() => apply(action)}
          aria-label={action.label}
          title={action.label}
          className="flex size-8 items-center justify-center rounded text-icon hover:bg-hover disabled:opacity-30"
        >
          <action.icon size={16} strokeWidth={1.75} />
        </button>
      ))}
      <button
        type="button"
        onClick={onTogglePreview}
        className="ml-auto flex h-8 items-center gap-1.5 rounded px-2 text-label-md text-on-surface-variant hover:bg-hover"
      >
        {preview ? <Pencil size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
        {preview ? '쓰기' : '미리보기'}
      </button>
    </div>
  )
}
