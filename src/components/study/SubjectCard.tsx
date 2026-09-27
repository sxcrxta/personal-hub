// 과목 카드 — 시험일 D-Day, 진도 막대, 공부 항목 체크·공부할 날 정하기·지우기·추가
import { CalendarDays, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { examActions } from '../../hooks/useStudy.ts'
import { dDayLabel, daysFromToday, formatDateKey, fromDateKey, todayKey } from '../../lib/date.ts'
import { paletteOf } from '../../lib/subjectColor.ts'
import { planLabel, progressOf } from '../../lib/studyRules.ts'
import type { Exam, ExamSubject } from '../../types/data.ts'
import Checkbox from '../common/Checkbox.tsx'
import SubjectChip from '../common/SubjectChip.tsx'

const BAR: Record<string, string> = {
  math: 'bg-math',
  science: 'bg-science',
  korean: 'bg-korean',
  english: 'bg-english',
  social: 'bg-social',
}

const PLAN_TONE = {
  today: 'bg-button text-on-primary',
  late: 'bg-urgent-bg text-urgent',
  later: 'bg-surface-container text-on-surface-variant',
}

type Props = {
  exam: Exam
  subject: ExamSubject
  onEdit: () => void
}

export default function SubjectCard({ exam, subject, onEdit }: Props) {
  const [text, setText] = useState('')
  const [datingId, setDatingId] = useState<string | null>(null)
  const progress = progressOf(subject.items)
  const days = daysFromToday(fromDateKey(subject.examDate))

  function add() {
    if (!text.trim()) return
    examActions.addItem(exam.id, subject.id, text.trim())
    setText('')
  }

  return (
    <article className="flex flex-col rounded-lg border bg-surface-container-lowest p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-headline-md">{subject.emoji}</span>
          <SubjectChip name={subject.name} />
          <span
            className={`rounded-full px-2 py-0.5 text-label-md tabular-nums ${days <= 3 ? 'bg-urgent-bg text-urgent' : 'bg-surface-container text-on-surface-variant'}`}
          >
            {dDayLabel(days)}
          </span>
        </div>
        <button type="button" onClick={onEdit} aria-label={`${subject.name} 고치기`} className="flex size-8 items-center justify-center rounded text-icon hover:bg-hover">
          <Pencil size={15} strokeWidth={1.75} />
        </button>
      </div>
      <h3 className="mt-3 text-headline-md">{subject.name}</h3>
      <p className="text-body-sm text-on-surface-variant">시험일 {formatDateKey(subject.examDate)}</p>

      <div className="mt-4">
        <div className="flex justify-between text-body-sm">
          <span className="text-on-surface-variant">진도</span>
          <span className="font-medium tabular-nums">
            {progress.percent}% ({progress.done}/{progress.total})
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-container">
          <div className={`h-full rounded-full ${BAR[paletteOf(subject.name)]}`} style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 border-t pt-3">
        {subject.items.map((item) => {
          const ref = { examId: exam.id, subjectId: subject.id, itemId: item.id }
          const plan = planLabel(item)
          return (
            <li key={item.id} className="group rounded px-1 py-1.5 hover:bg-hover-soft">
              <div className="flex items-start gap-2.5">
                <div className="pt-0.5">
                  <Checkbox checked={item.done} onChange={() => examActions.toggleItem(ref)} label={`${item.title} 완료`} />
                </div>
                <span className={`flex-1 text-body-md ${item.done ? 'text-placeholder line-through' : ''}`}>{item.title}</span>
                <button
                  type="button"
                  onClick={() => setDatingId(datingId === item.id ? null : item.id)}
                  title="공부할 날 정하기"
                  className={`flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-label-md ${plan ? PLAN_TONE[plan.tone] : 'text-placeholder hover:bg-hover'}`}
                >
                  {plan ? plan.text : <CalendarDays size={14} strokeWidth={1.75} />}
                </button>
                <button
                  type="button"
                  onClick={() => examActions.removeItem(ref)}
                  aria-label={`${item.title} 지우기`}
                  className="flex size-6 shrink-0 items-center justify-center rounded text-placeholder opacity-0 group-hover:opacity-100 hover:bg-hover focus:opacity-100"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>
              {datingId === item.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
                  <input
                    type="date"
                    value={item.planDate ?? ''}
                    max={subject.examDate}
                    onChange={(e) => examActions.updateItem(ref, { planDate: e.target.value || undefined })}
                    className="h-8 rounded border border-field-border bg-surface-container-lowest px-2 text-body-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      examActions.updateItem(ref, { planDate: todayKey() })
                      setDatingId(null)
                    }}
                    className="h-8 rounded border border-field-border px-2 text-label-md hover:bg-hover-soft"
                  >
                    오늘로
                  </button>
                  {item.planDate && (
                    <button
                      type="button"
                      onClick={() => {
                        examActions.updateItem(ref, { planDate: undefined })
                        setDatingId(null)
                      }}
                      className="h-8 rounded px-2 text-label-md text-on-surface-variant hover:bg-hover"
                    >
                      날짜 빼기
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <div className="mt-2 flex items-center gap-2.5 px-1">
        <Plus size={18} strokeWidth={1.75} className="text-placeholder" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
          placeholder="공부할 것 추가 (예: 수특 3강 풀기)"
          className="h-8 flex-1 bg-transparent text-body-md placeholder:text-placeholder focus:outline-none"
        />
      </div>
    </article>
  )
}
