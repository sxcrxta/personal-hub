// 기한별 일정 및 학업 — 기한 지남 / 오늘 / 3일 이내 / 7일 이내 네 칸. 데스크톱은 가로로, 폰은 세로로 쌓인다
import { formatMonthDay, now } from '../../lib/date.ts'
import { BUCKETS, type DueBucket, type DueItem } from '../../lib/due.ts'
import DueItemCard from './DueItemCard.tsx'

const DOT: Record<DueBucket, string> = {
  overdue: 'bg-due-overdue',
  today: 'bg-due-today',
  soon: 'bg-due-soon',
  week: 'bg-due-week',
}

/** 칸 제목 옆에 보여줄 날짜 범위 */
function rangeLabel(bucket: DueBucket): string {
  const today = now()
  if (bucket === 'overdue') return '바로 처리하기'
  if (bucket === 'today') return formatMonthDay(today)
  if (bucket === 'soon') return `~${formatMonthDay(today.plus({ days: 3 }))}`
  return `~${formatMonthDay(today.plus({ days: 7 }))}`
}

type Props = {
  groups: Record<DueBucket, DueItem[]>
  onToggle: (item: DueItem) => void
}

export default function DueBoard({ groups, onToggle }: Props) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-headline-lg">기한별 일정 및 학업</h2>
        <p className="text-body-md text-on-surface-variant">가까운 것부터 차례로</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BUCKETS.map(({ id, label }) => {
          const items = groups[id]
          return (
            <div
              key={id}
              className={`rounded-lg border p-4 ${
                id === 'overdue' && items.length ? 'border-due-overdue/30 bg-surface-container-lowest' : 'bg-surface-container-lowest'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${DOT[id]}`} />
                  <h3 className={`text-headline-sm ${id === 'overdue' ? 'text-due-overdue' : ''}`}>{label}</h3>
                  <span className="rounded-sm bg-surface-container px-1.5 text-label-md tabular-nums text-on-surface-variant">
                    {items.length}
                  </span>
                </div>
                <span className={`text-body-sm ${id === 'overdue' ? 'text-due-overdue' : 'text-on-surface-variant'}`}>
                  {rangeLabel(id)}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-3">
                {items.length ? (
                  items.map((item) => <DueItemCard key={item.key} item={item} bucket={id} onToggle={onToggle} />)
                ) : (
                  <p className="py-6 text-center text-body-sm text-placeholder">없어요</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
