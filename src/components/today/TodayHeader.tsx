// 오늘 화면 맨 위 — 챙길 항목 수, 기한 지난 수, 오늘 일정 수, 가장 가까운 시험 D-Day
import { dDayLabel } from '../../lib/date.ts'
import type { DueBucket, DueItem } from '../../lib/due.ts'
import { countPending } from '../../lib/due.ts'

type Props = {
  groups: Record<DueBucket, DueItem[]>
  nextExam?: DueItem
}

export default function TodayHeader({ groups, nextExam }: Props) {
  const pending = countPending(groups)
  const overdue = groups.overdue.length
  const todayEvents = groups.today.filter((i) => i.kind === 'event').length

  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-1 text-display-hero-mobile md:text-display-hero">
          오늘 챙겨야 할 항목 <span className="tabular-nums">{pending}</span>개
        </h1>
        {overdue > 0 && (
          <span className="rounded-full border border-urgent/25 bg-urgent-bg px-2.5 py-0.5 text-label-md text-urgent">
            기한 지남 {overdue}개
          </span>
        )}
        <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-md text-on-surface-variant">
          오늘 일정 {todayEvents}개
        </span>
        {nextExam && (
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-md text-on-surface-variant">
            {nextExam.title} <span className="tabular-nums">{dDayLabel(nextExam.days)}</span>
          </span>
        )}
      </div>
    </header>
  )
}
