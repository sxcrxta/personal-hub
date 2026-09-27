// 달력 위 도구 막대 — 이전·오늘·다음, 보고 있는 기간, 일·주·월 바꾸기, 일정 추가
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Button from '../common/Button.tsx'
import type { CalendarViewName } from './CalendarView.tsx'

const VIEWS: { id: CalendarViewName; label: string }[] = [
  { id: 'timeGridDay', label: '일' },
  { id: 'timeGridWeek', label: '주' },
  { id: 'dayGridMonth', label: '월' },
]

type Props = {
  title: string
  view: CalendarViewName
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onView: (view: CalendarViewName) => void
  onAdd: () => void
  compact?: boolean
}

export default function CalendarToolbar({ title, view, onPrev, onNext, onToday, onView, onAdd, compact }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <div className="flex items-center rounded border border-field-border bg-surface-container-lowest">
        <button type="button" onClick={onPrev} aria-label="이전" className="flex size-9 items-center justify-center text-icon hover:bg-hover">
          <ChevronLeft size={18} strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onToday} className="h-9 border-x px-3 text-label-md hover:bg-hover">
          오늘
        </button>
        <button type="button" onClick={onNext} aria-label="다음" className="flex size-9 items-center justify-center text-icon hover:bg-hover">
          <ChevronRight size={18} strokeWidth={1.75} />
        </button>
      </div>

      <h1 className={`${compact ? 'order-last w-full text-headline-sm' : 'text-headline-lg'} min-w-0`}>{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div role="tablist" className="flex rounded border border-field-border bg-surface-container-low p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => onView(v.id)}
              className={`h-8 rounded-sm px-3 text-label-md ${
                view === v.id ? 'bg-surface-container-lowest text-on-surface shadow-card' : 'text-on-surface-variant'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={onAdd} className={compact ? 'px-3' : ''}>
          <Plus size={16} strokeWidth={2} />
          {compact ? '' : '일정 추가'}
          {compact && <span className="sr-only">일정 추가</span>}
        </Button>
      </div>
    </div>
  )
}
