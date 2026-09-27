// 폰 하단 탭 막대 — 사이드바 대신 메뉴 5개를 아래에 둔다
import { NavLink } from 'react-router'
import { NAV_ITEMS } from './navItems.ts'

export default function TabBarMobile() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex h-16 flex-col items-center justify-center gap-1 text-label-sm transition-colors ${
              isActive ? 'text-primary' : 'text-placeholder'
            }`
          }
        >
          <Icon size={22} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
