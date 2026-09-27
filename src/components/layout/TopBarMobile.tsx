// 폰 상단바 — 지금 화면 이름과 설정 버튼
import { Settings } from 'lucide-react'
import { useLocation } from 'react-router'
import { NAV_ITEMS } from './navItems.ts'

type Props = {
  onOpenSettings: () => void
}

export default function TopBarMobile({ onOpenSettings }: Props) {
  const { pathname } = useLocation()
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.to))

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
      <p className="text-headline-md">{current?.label ?? 'Personal Hub'}</p>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="설정"
        className="flex size-9 items-center justify-center rounded text-icon transition-colors hover:bg-hover"
      >
        <Settings size={20} strokeWidth={1.75} />
      </button>
    </header>
  )
}
