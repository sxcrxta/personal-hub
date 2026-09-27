// 달력 블록 종류 안내 — 일반 일정과 할 일·공부·마감·시험을 구별하는 법
const ITEMS = [
  { className: 'legend-event', label: '일정' },
  { className: 'legend-todo', label: '할 일' },
  { className: 'legend-study', label: '공부' },
  { className: 'legend-deadline', label: '수행평가 마감' },
  { className: 'legend-exam', label: '시험' },
]

export default function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
      {ITEMS.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`legend-swatch ${item.className}`} />
          {item.label}
        </span>
      ))}
      <span className="hidden text-placeholder md:inline">· 빈 시간을 끌면 일정이 생겨요</span>
    </div>
  )
}
