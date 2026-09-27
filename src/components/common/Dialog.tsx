// 공용 창(모달) — 바깥을 누르거나 Esc를 누르면 닫힌다. 폰에서는 아래에서 올라온다
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  size?: 'md' | 'lg'
}

export default function Dialog({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // 창이 열려 있는 동안 뒤 화면이 스크롤되지 않게
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-on-surface/30 md:items-center md:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[90dvh] w-full flex-col rounded-t-xl border bg-surface-container-lowest shadow-pop md:rounded-xl ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0 text-headline-md">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex size-8 shrink-0 items-center justify-center rounded text-icon transition-colors hover:bg-hover"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 pb-[calc(20px+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  )
}
