// FullCalendar를 앱에 맞게 설정한 달력 — 15분 단위, 한국 시간, 끌어서 만들기·옮기기, 블록 종류별 모양
import type { DateSelectArg, EventClickArg, EventContentArg, EventDropArg } from '@fullcalendar/core'
import koLocale from '@fullcalendar/core/locales/ko'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction'
import luxonPlugin from '@fullcalendar/luxon3'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { DateTime } from 'luxon'
import type { RefObject } from 'react'
import { useCalendarItems, KIND_LABEL, type CalendarKind } from '../../hooks/useCalendarItems.ts'
import { eventActions } from '../../hooks/useEvents.ts'
import { APP_ZONE, toUtc } from '../../lib/date.ts'

export type CalendarViewName = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'

type Props = {
  calendarRef: RefObject<FullCalendar | null>
  initialView: CalendarViewName
  initialDate?: string
  onDatesChange: (title: string, view: CalendarViewName, start: Date) => void
  onSelectRange: (startStr: string, endStr: string, allDay: boolean) => void
  onOpenEvent: (id: string, kind: CalendarKind, extra: Record<string, string>) => void
}

export default function CalendarView({ calendarRef, initialView, initialDate, onDatesChange, onSelectRange, onOpenEvent }: Props) {
  const items = useCalendarItems()

  function handleSelect(info: DateSelectArg) {
    onSelectRange(info.startStr, info.endStr, info.allDay)
    info.view.calendar.unselect()
  }

  function handleClick(info: EventClickArg) {
    const { kind, ...extra } = info.event.extendedProps as { kind: CalendarKind } & Record<string, string>
    onOpenEvent(info.event.id, kind, extra)
  }

  // 끌어서 옮기거나 길이를 바꾸면 저장한다
  function handleMove(info: EventDropArg | EventResizeDoneArg) {
    const { startStr, endStr } = info.event
    if (!endStr) return
    eventActions.update(info.event.id, {
      start: toUtc(DateTime.fromISO(startStr, { zone: APP_ZONE })),
      end: toUtc(DateTime.fromISO(endStr, { zone: APP_ZONE })),
    })
  }

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, luxonPlugin]}
      locale={koLocale}
      timeZone={APP_ZONE}
      initialView={initialView}
      initialDate={initialDate}
      headerToolbar={false}
      height="100%"
      events={items}
      selectable
      selectMirror
      editable
      nowIndicator
      firstDay={1}
      slotDuration="00:30:00"
      snapDuration="00:15:00"
      scrollTime="08:00:00"
      allDayText="종일"
      slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      dayMaxEvents={3}
      select={handleSelect}
      eventClick={handleClick}
      eventDrop={handleMove}
      eventResize={handleMove}
      datesSet={(arg) => onDatesChange(arg.view.title, arg.view.type as CalendarViewName, arg.view.currentStart)}
      eventContent={renderEvent}
    />
  )
}

/** 블록 안의 모양: 종류 이름표 + 제목 + 시각 */
function renderEvent(arg: EventContentArg) {
  const kind = arg.event.extendedProps.kind as CalendarKind
  const location = arg.event.extendedProps.location as string | undefined
  return (
    <div className="ev-inner">
      {kind !== 'event' && <span className="ev-label">{KIND_LABEL[kind]}</span>}
      <span className="ev-title">{arg.event.title}</span>
      {arg.timeText && !arg.event.allDay && <span className="ev-time">{arg.timeText}</span>}
      {location && arg.view.type !== 'dayGridMonth' && <span className="ev-time">{location}</span>}
    </div>
  )
}
