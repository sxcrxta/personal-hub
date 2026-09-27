// 알림 막대 — 화면 아래 가운데에 잠깐 떴다가 사라진다. 폰에서는 하단 탭 위에 뜬다
import { X } from 'lucide-react'
import { useStore } from '../../hooks/useStore.ts'
import { hideToast, toastStore } from '../../lib/toast.ts'

export default function Toast() {
  const [toast] = useStore(toastStore)
  if (!toast) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-8">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-3 rounded bg-button py-2.5 pr-2 pl-4 text-body-md text-on-primary shadow-pop"
      >
        <span>{toast.message}</span>
        {toast.actionLabel && (
          <button
            type="button"
            onClick={() => {
              toast.action?.()
              hideToast()
            }}
            className="rounded px-2 py-1 text-label-md text-secondary-container underline-offset-4 hover:underline"
          >
            {toast.actionLabel}
          </button>
        )}
        <button type="button" onClick={hideToast} aria-label="닫기" className="flex size-7 items-center justify-center rounded opacity-70 hover:opacity-100">
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
