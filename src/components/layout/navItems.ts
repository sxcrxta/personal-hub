// 사이드바와 하단 탭이 함께 쓰는 메뉴 목록 — 메뉴를 고칠 때 여기 한 곳만 고친다
import { CalendarCheck, CalendarDays, CircleCheck, FileText, GraduationCap, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/today', label: '오늘', icon: CalendarCheck },
  { to: '/calendar', label: '일정', icon: CalendarDays },
  { to: '/todo', label: '할 일', icon: CircleCheck },
  { to: '/memo', label: '메모', icon: FileText },
  { to: '/study', label: '학업 관리', icon: GraduationCap },
]
