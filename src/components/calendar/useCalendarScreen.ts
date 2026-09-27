// 일정 화면의 상태 — 보고 있는 기간·보기 방식, 열린 편집 칸, 주소(?date=&event=)로 바로 열기
import type FullCalendar from '@fullcalendar/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { CalendarKind } from '../../hooks/useCalendarItems.ts'
import { toDateKey } from '../../lib/date.ts'
import { eventsStore } from '../../lib/stores.ts'
import type { CalendarViewName } from './CalendarView.tsx'
import { draftForNew, draftFromEvent, draftFromRange, type EventDraft } from './eventDraft.ts'
import { DateTime } from 'luxon'

export function useCalendarScreen(defaultView: CalendarViewName) {
  const calendarRef = useRef<FullCalendar | null>(null)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [view, setView] = useState<CalendarViewName>(defaultView)
  const [viewStart, setViewStart] = useState<string | undefined>()
  // 다른 화면에서 ?event=… 로 들어오면 그 일정을 열어 둔 채 시작한다
  const [draft, setDraft] = useState<EventDraft | null>(() => {
    const event = eventsStore.get().find((e) => e.id === params.get('event'))
    return event ? draftFromEvent(event) : null
  })

  const api = () => calendarRef.current?.getApi()
  const initialDate = params.get('date') ?? undefined

  // ?date=… 로 들어오면 그 날짜로 옮기고, 다 읽은 주소 글자는 지운다
  useEffect(() => {
    const date = params.get('date')
    if (date) calendarRef.current?.getApi().gotoDate(date)
    if (date || params.get('event')) setParams({}, { replace: true })
  }, [params, setParams])

  return {
    calendarRef,
    title,
    view,
    draft,
    initialDate,
    closeDraft: () => setDraft(null),
    prev: () => api()?.prev(),
    next: () => api()?.next(),
    today: () => api()?.today(),
    changeView: (v: CalendarViewName) => api()?.changeView(v),
    addNew: () => {
      // 오늘이 보이는 기간이면 오늘, 아니면 보고 있는 기간의 첫날에
      const today = toDateKey(DateTime.now())
      const onScreen = api()?.view
      const inRange = onScreen && today >= toDateKey(DateTime.fromJSDate(onScreen.currentStart)) && today < toDateKey(DateTime.fromJSDate(onScreen.currentEnd))
      setDraft(draftForNew(inRange ? undefined : viewStart))
    },
    onDatesChange: (t: string, v: CalendarViewName, start: Date) => {
      setTitle(t)
      setView(v)
      setViewStart(toDateKey(DateTime.fromJSDate(start)))
    },
    onSelectRange: (s: string, e: string, allDay: boolean) => setDraft(draftFromRange(s, e, allDay)),
    onOpenEvent: (id: string, kind: CalendarKind, extra: Record<string, string>) => {
      if (kind === 'deadline') return navigate(`/study?tab=assignments&focus=${extra.assignmentId}`)
      if (kind === 'exam') return navigate('/study')
      const event = eventsStore.get().find((e) => e.id === id)
      if (event) setDraft(draftFromEvent(event))
    },
  }
}
