// 이모지 고르기 — 버튼을 누르면 목록이 펼쳐지고, 하나를 누르면 닫힌다
import { useState } from 'react'
import { EMOJI_CHOICES } from '../../lib/nameStyle.ts'

type Props = {
  value: string
  onChange: (emoji: string) => void
}

export default function EmojiPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="이모지 고르기"
        className="flex size-[38px] items-center justify-center rounded border border-field-border text-headline-md hover:bg-hover-soft"
      >
        {value}
      </button>
      {open && (
        <div className="absolute top-11 left-0 z-10 grid w-64 grid-cols-6 gap-1 rounded-md border bg-surface-container-lowest p-2 shadow-pop">
          {EMOJI_CHOICES.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji)
                setOpen(false)
              }}
              className={`flex size-9 items-center justify-center rounded text-headline-md hover:bg-hover ${
                emoji === value ? 'bg-surface-container' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
