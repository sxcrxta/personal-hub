// 데스크톱 왼쪽 사이드바 — 앱 이름, 메뉴 5개, 맨 아래 설정 버튼
import { BookOpen, Settings } from 'lucide-react'
import { NavLink } from 'react-router'
import { NAV_ITEMS } from './navItems.ts'

type Props = {
  onOpenSettings: () => void
}

export default function SidebarDesktop({ onOpenSettings }: Props) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col border-r bg-surface-container-low px-4 py-6 md:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-9 items-center justify-center rounded border bg-surface-container-lowest text-primary-container">
          <BookOpen size={18} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-headline-sm text-primary">Personal Hub</p>
          <p className="text-body-sm text-on-surface-variant">메모 · 일정 · 학업</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-11 items-center gap-3 rounded px-3 text-body-md transition-colors ${
                isActive
                  ? 'bg-surface-container-high font-medium text-on-surface'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t pt-4">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-11 w-full items-center gap-3 rounded px-3 text-body-md text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <Settings size={20} strokeWidth={1.75} />
          설정
        </button>
      </div>
    </aside>
  )
}
