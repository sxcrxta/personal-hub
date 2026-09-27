// 기한별 칸 안의 항목 카드 하나 — D-Day, 과목, 종류, 제목, 기한을 보여주고 할 수 있는 항목은 체크한다
import { BookOpen, CalendarDays, CircleCheck, ClipboardList, Clock, GraduationCap, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { dDayLabel, toDateKey } from '../../lib/date.ts'
import { dueText, type DueBucket, type DueItem, type DueKind } from '../../lib/due.ts'
import Checkbox from '../common/Checkbox.tsx'
import SubjectChip from '../common/SubjectChip.tsx'

const KIND: Record<DueKind, { label: string; icon: LucideIcon }> = {
  event: { label: '일정', icon: CalendarDays },
  todo: { label: '할 일', icon: CircleCheck },
  study: { label: '시험공부', icon: BookOpen },
  exam: { label: '시험', icon: GraduationCap },
  assignment: { label: '수행평가', icon: ClipboardList },
}

// D-Day 알약 색: 칸마다 다르게
const DDAY_CLASS: Record<DueBucket, string> = {
  overdue: 'bg-urgent-bg text-due-overdue border-due-overdue/25',
  today: 'bg-math-bg text-due-today border-due-today/25',
  soon: 'bg-social-bg text-due-soon border-due-soon/25',
  week: 'bg-surface-container-low text-on-surface-variant border-outline-variant',
}

type Props = {
  item: DueItem
  bucket: DueBucket
  onToggle: (item: DueItem) => void
}

/** 항목을 누르면 가는 곳 */
function linkOf(item: DueItem): string {
  const ref = item.ref
  if (ref.kind === 'event') return `/calendar?date=${toDateKey(item.due)}&event=${ref.id}`
  if (ref.kind === 'todo') return `/todo?todo=${ref.id}`
  if (ref.kind === 'assignment') return `/study?tab=assignments&focus=${ref.id}`
  return '/study'
}

export default function DueItemCard({ item, bucket, onToggle }: Props) {
  const navigate = useNavigate()
  const { label, icon: KindIcon } = KIND[item.kind]
  const done = item.done === true

  return (
    <article
      className={`flex gap-3 rounded border p-4 ${
        bucket === 'overdue' ? 'border-due-overdue/20 bg-urgent-bg/60' : 'bg-surface-container-lowest'
      }`}
    >
      <div className="pt-0.5">
        {item.done !== undefined ? (
          <Checkbox checked={done} onChange={() => onToggle(item)} label={`${item.title} 완료`} />
        ) : (
          <span className="block size-[18px]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex h-6 items-center rounded-full border px-2 text-label-md tabular-nums ${DDAY_CLASS[bucket]}`}>
            {dDayLabel(item.days)}
          </span>
          {item.subject && <SubjectChip name={item.subject} />}
          <span className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant">
            <KindIcon size={14} strokeWidth={1.75} />
            {label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate(linkOf(item))}
          className={`mt-2 block text-left text-body-lg hover:underline ${done ? 'text-placeholder line-through' : ''}`}
        >
          {item.title}
        </button>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-2 text-body-sm">
          <span className={`flex items-center gap-1.5 ${bucket === 'overdue' ? 'text-due-overdue' : 'text-on-surface-variant'}`}>
            <Clock size={14} strokeWidth={1.75} />
            {dueText(item)}
          </span>
          {item.detail && <span className="text-on-surface-variant">{item.detail}</span>}
        </div>
      </div>
    </article>
  )
}
