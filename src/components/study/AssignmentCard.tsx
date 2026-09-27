// 수행평가 카드 — 과목·마감, 준비 단계 막대와 체크, 제출 완료 처리, 캘린더에서 보기, 고치기
import { CalendarDays, Check, Clock, Pencil, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router'
import { assignmentActions } from '../../hooks/useStudy.ts'
import { assignmentDue, type AssignmentGroup } from '../../lib/studyRules.ts'
import type { Assignment } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import Checkbox from '../common/Checkbox.tsx'
import SubjectChip from '../common/SubjectChip.tsx'

const EDGE: Record<AssignmentGroup, string> = {
  urgent: 'border-l-urgent',
  soon: 'border-l-due-soon',
  later: 'border-l-outline-variant',
  done: 'border-l-science',
}

type Props = {
  assignment: Assignment
  group: AssignmentGroup
  highlighted: boolean
  onEdit: () => void
}

export default function AssignmentCard({ assignment: a, group, highlighted, onEdit }: Props) {
  const navigate = useNavigate()
  const due = assignmentDue(a)
  const doneSteps = a.steps.filter((s) => s.done).length
  const nextStep = a.steps.find((s) => !s.done)

  return (
    <article
      id={`assignment-${a.id}`}
      className={`rounded-lg border border-l-[3px] bg-surface-container-lowest p-5 shadow-card ${EDGE[group]} ${
        highlighted ? 'ring-2 ring-secondary-container' : ''
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <SubjectChip name={a.subject} />
            <span
              className={`flex h-6 items-center gap-1 rounded-full border px-2 text-label-md tabular-nums ${
                group === 'urgent' ? 'border-urgent/25 bg-urgent-bg text-urgent' : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              <Clock size={12} strokeWidth={2} />
              {due.dday} · {due.text}
            </span>
          </div>
          <h3 className={`mt-2 text-headline-sm ${a.done ? 'text-placeholder line-through' : ''}`}>{a.title}</h3>
          {a.memo && <p className="mt-1 text-body-sm text-on-surface-variant">{a.memo}</p>}

          {a.steps.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-body-sm">
                <span className="text-on-surface-variant tabular-nums">
                  준비 단계 {doneSteps}/{a.steps.length}
                </span>
                {nextStep && !a.done && <span className="text-on-surface-variant">다음: {nextStep.title}</span>}
              </div>
              <div className="mt-1.5 flex gap-1">
                {a.steps.map((s) => (
                  <span key={s.id} className={`h-1.5 flex-1 rounded-full ${s.done ? 'bg-primary-container' : 'bg-surface-container'}`} />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {a.steps.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-2 text-body-sm">
                    <Checkbox checked={s.done} onChange={() => assignmentActions.toggleStep(a.id, s.id)} label={`${s.title} 완료`} />
                    <span className={s.done ? 'text-placeholder line-through' : ''}>
                      {i + 1}. {s.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 md:w-36 md:flex-col">
          <Button variant={a.done ? 'secondary' : 'primary'} size="sm" onClick={() => assignmentActions.toggle(a.id)}>
            {a.done ? <RotateCcw size={14} strokeWidth={1.75} /> : <Check size={14} strokeWidth={2} />}
            {a.done ? '제출 취소' : '제출 완료'}
          </Button>
          <Button size="sm" onClick={() => navigate(`/calendar?date=${a.dueDate}`)}>
            <CalendarDays size={14} strokeWidth={1.75} />
            캘린더에서 보기
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={14} strokeWidth={1.75} />
            고치기
          </Button>
        </div>
      </div>
    </article>
  )
}
