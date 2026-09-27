// 데스크톱 일정 화면 — 주간 보기가 기본이고, 일정을 누르거나 만들면 오른쪽에 상세 패널이 열린다
import { X } from 'lucide-react'
import CalendarLegend from './CalendarLegend.tsx'
import CalendarToolbar from './CalendarToolbar.tsx'
import CalendarView from './CalendarView.tsx'
import EventEditor from './EventEditor.tsx'
import { useCalendarScreen } from './useCalendarScreen.ts'

export default function CalendarDesktop() {
  const s = useCalendarScreen('timeGridWeek')

  return (
    <div className="flex gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <CalendarToolbar
          title={s.title}
          view={s.view}
          onPrev={s.prev}
          onNext={s.next}
          onToday={s.today}
          onView={s.changeView}
          onAdd={s.addNew}
        />
        <CalendarLegend />
        <div className="h-[calc(100dvh-270px)] min-h-[560px] overflow-hidden rounded-lg border bg-surface-container-lowest shadow-card">
          <CalendarView
            calendarRef={s.calendarRef}
            initialView="timeGridWeek"
            initialDate={s.initialDate}
            onDatesChange={s.onDatesChange}
            onSelectRange={s.onSelectRange}
            onOpenEvent={s.onOpenEvent}
          />
        </div>
      </div>

      {s.draft && (
        <aside className="sticky top-[100px] h-fit max-h-[calc(100dvh-124px)] w-[340px] shrink-0 overflow-y-auto rounded-lg border bg-surface-container-lowest p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-headline-md">{s.draft.id ? '일정 상세' : '새 일정'}</h2>
            <button
              type="button"
              onClick={s.closeDraft}
              aria-label="닫기"
              className="flex size-8 items-center justify-center rounded text-icon hover:bg-hover"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
          {/* key: 다른 일정을 열면 편집 칸을 새로 채운다 */}
          <EventEditor key={`${s.draft.id ?? 'new'}-${s.draft.date}-${s.draft.startTime}`} initial={s.draft} onClose={s.closeDraft} />
        </aside>
      )}
    </div>
  )
}
