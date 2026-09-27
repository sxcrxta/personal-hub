// 해시태그 입력 — 쓰고 Enter·쉼표·띄어쓰기를 누르면 태그가 되고, 빈 칸에서 지우기를 누르면 마지막 태그가 빠진다
import { Tag, X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  tags: string[]
  onChange: (tags: string[]) => void
}

export default function TagInput({ tags, onChange }: Props) {
  const [text, setText] = useState('')

  function commit() {
    const tag = text.trim().replace(/^#/, '').replace(/,$/, '')
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setText('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag size={15} strokeWidth={1.75} className="text-icon" />
      {tags.map((tag) => (
        <span key={tag} className="flex h-7 items-center gap-1 rounded-full border border-math/25 bg-math-bg pr-1 pl-2.5 text-label-md text-math">
          #{tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            aria-label={`${tag} 태그 빼기`}
            className="flex size-5 items-center justify-center rounded-full hover:bg-surface-container-lowest"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return
          if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !text && tags.length) {
            onChange(tags.slice(0, -1))
          }
        }}
        onBlur={commit}
        placeholder={tags.length ? '' : '#태그 입력'}
        className="h-7 min-w-24 flex-1 bg-transparent text-body-md placeholder:text-placeholder focus:outline-none"
      />
    </div>
  )
}
