// 일정 화면(/calendar) — 데스크톱과 폰 화면을 따로 그린다
import CalendarDesktop from '../components/calendar/CalendarDesktop.tsx'
import CalendarMobile from '../components/calendar/CalendarMobile.tsx'
import { useIsMobile } from '../hooks/useIsMobile.ts'

export default function CalendarPage() {
  return useIsMobile() ? <CalendarMobile /> : <CalendarDesktop />
}
