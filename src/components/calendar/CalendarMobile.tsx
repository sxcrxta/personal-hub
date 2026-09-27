// 폰 일정 화면 — 하루 보기가 기본이고, 일정을 누르거나 만들면 아래에서 편집 시트가 올라온다
import Dialog from '../common/Dialog.tsx'
import CalendarLegend from './CalendarLegend.tsx'
import CalendarToolbar from './CalendarToolbar.tsx'
import CalendarView from './CalendarView.tsx'
import EventEditor from './EventEditor.tsx'
import { useCalendarScreen } from './useCalendarScreen.ts'

export default function CalendarMobile() {
  const s = useCalendarScreen('timeGridDay')

  return (
    <div className="flex flex-col gap-3">
      <CalendarToolbar
        compact
        title={s.title}
        view={s.view}
        onPrev={s.prev}
        onNext={s.next}
        onToday={s.today}
        onView={s.changeView}
        onAdd={s.addNew}
      />
      <CalendarLegend />
      <div className="h-[calc(100dvh-300px)] min-h-[440px] overflow-hidden rounded-lg border bg-surface-container-lowest">
        <CalendarView
          calendarRef={s.calendarRef}
          initialView="timeGridDay"
          initialDate={s.initialDate}
          onDatesChange={s.onDatesChange}
          onSelectRange={s.onSelectRange}
          onOpenEvent={s.onOpenEvent}
        />
      </div>

      <Dialog open={!!s.draft} onClose={s.closeDraft} title={s.draft?.id ? '일정 상세' : '새 일정'}>
        {s.draft && (
          <EventEditor key={`${s.draft.id ?? 'new'}-${s.draft.date}-${s.draft.startTime}`} initial={s.draft} onClose={s.closeDraft} />
        )}
      </Dialog>
    </div>
  )
}
