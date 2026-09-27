// 데스크톱 상단바 — 오늘 날짜를 보여준다
import { Calendar } from 'lucide-react'
import { todayLabel } from '../../lib/date.ts'

export default function TopBarDesktop() {
  return (
    <header className="sticky top-0 z-10 hidden h-[76px] items-center gap-3 border-b bg-background/90 px-8 backdrop-blur md:flex">
      <Calendar size={20} strokeWidth={1.75} className="text-icon" />
      <p className="text-headline-md">{todayLabel()}</p>
    </header>
  )
}
