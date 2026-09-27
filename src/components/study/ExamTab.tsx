// 시험공부 탭 — 시험 D-Day와 전체 진도, 오늘 공부할 것(캘린더 배치), 과목별 카드, 지난 시험 기록
import { CalendarPlus, ChevronDown, Pencil, Plus, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { examActions, useExams } from '../../hooks/useStudy.ts'
import { formatDateKey, fromDateKey, daysFromToday } from '../../lib/date.ts'
import { examDday, examProgress, splitExams } from '../../lib/studyRules.ts'
import { showToast } from '../../lib/toast.ts'
import type { Exam } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import Checkbox from '../common/Checkbox.tsx'
import SubjectChip from '../common/SubjectChip.tsx'
import ExamDialog from './ExamDialog.tsx'
import SubjectCard from './SubjectCard.tsx'
import SubjectDialog from './SubjectDialog.tsx'

type DialogState = { kind: 'exam'; exam?: Exam } | { kind: 'subject'; subjectId?: string } | null

export default function ExamTab() {
  const exams = useExams()
  const navigate = useNavigate()
  const { current, past } = splitExams(exams)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pastOpen, setPastOpen] = useState(false)
  const exam = current.find((e) => e.id === selectedId) ?? current[0]

  const dialogs = (
    <>
      {dialog?.kind === 'exam' && <ExamDialog exam={dialog.exam} onClose={() => setDialog(null)} onCreated={setSelectedId} />}
      {dialog?.kind === 'subject' && exam && (
        <SubjectDialog exam={exam} subject={exam.subjects.find((s) => s.id === dialog.subjectId)} onClose={() => setDialog(null)} />
      )}
    </>
  )

  if (!exam) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-14 text-center">
          <p className="text-headline-sm">다가오는 시험이 없어요</p>
          <p className="text-body-md text-on-surface-variant">시험을 등록하면 D-Day와 과목별 진도를 챙길 수 있어요.</p>
          <Button variant="primary" onClick={() => setDialog({ kind: 'exam' })}>
            <Plus size={16} strokeWidth={2} />새 시험 등록
          </Button>
        </div>
        <PastExams past={past} open={pastOpen} onToggle={() => setPastOpen((v) => !v)} />
        {dialogs}
      </div>
    )
  }

  const dday = examDday(exam)
  const progress = examProgress(exam)
  // 오늘 공부할 것: 오늘로 정했거나 날짜가 지났는데 아직 안 한 것
  const todayItems = exam.subjects.flatMap((s) =>
    s.items
      .filter((i) => i.planDate && daysFromToday(fromDateKey(i.planDate)) <= 0 && (!i.done || daysFromToday(fromDateKey(i.planDate)) === 0))
      .map((i) => ({ item: i, subject: s })),
  )
  const subjects = exam.subjects.filter((s) => !subjectFilter || s.id === subjectFilter)

  function placeToday() {
    const count = examActions.placeOnCalendar(
      todayItems
        .filter(({ item }) => !item.done)
        .map(({ item, subject }) => ({ ref: { examId: exam.id, subjectId: subject.id, itemId: item.id }, title: item.title, subject: subject.name })),
    )
    if (count) showToast(`캘린더에 ${count}개 배치했어요`, '일정 보기', () => navigate('/calendar'))
    else showToast('이미 모두 캘린더에 있어요', '일정 보기', () => navigate('/calendar'))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 시험 머리 */}
      <section className="flex flex-col gap-5 rounded-lg border border-l-[3px] border-l-primary-container bg-surface-container-lowest p-5 shadow-card md:flex-row md:items-center">
        <div className="flex items-center gap-4 md:flex-1">
          <div className={`flex size-20 shrink-0 flex-col items-center justify-center rounded-md border ${dday.days <= 7 ? 'border-urgent/25 bg-urgent-bg text-urgent' : 'bg-surface-container-low text-primary'}`}>
            <span className="text-label-sm">D-DAY</span>
            <span className="text-headline-lg tabular-nums">{dday.label}</span>
          </div>
          <div className="min-w-0">
            {current.length > 1 ? (
              <select
                value={exam.id}
                onChange={(e) => setSelectedId(e.target.value)}
                className="-ml-1 max-w-full rounded bg-transparent text-headline-lg focus:outline-none"
              >
                {current.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            ) : (
              <h2 className="text-headline-lg">{exam.name}</h2>
            )}
            <p className="text-body-sm text-on-surface-variant">
              {formatDateKey(exam.startDate)} ~ {formatDateKey(exam.endDate)} · {exam.subjects.length}과목
            </p>
          </div>
        </div>
        <div className="rounded-md border bg-surface-container-low p-3 md:w-56">
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">전체 진도</span>
            <span className="font-medium tabular-nums">{progress.percent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-primary-container" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-1.5 text-body-sm text-on-surface-variant tabular-nums">
            {progress.done}개 완료 · {progress.total - progress.done}개 남음
          </p>
        </div>
        <div className="flex gap-2 md:flex-col">
          <Button variant="primary" size="sm" onClick={() => setDialog({ kind: 'exam' })}>
            <Plus size={14} strokeWidth={2} />새 시험 등록
          </Button>
          <Button size="sm" onClick={() => setDialog({ kind: 'exam', exam })}>
            <Pencil size={14} strokeWidth={1.75} />
            시험 고치기
          </Button>
        </div>
      </section>

      {/* 오늘 공부할 것 */}
      <section className="rounded-lg border bg-surface-container-lowest p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <PlayCircle size={20} strokeWidth={1.75} className="text-icon" />
          <h2 className="text-headline-sm">오늘 공부할 것</h2>
          <span className="rounded-full bg-button px-2 py-0.5 text-label-md text-on-primary tabular-nums">{todayItems.filter((t) => !t.item.done).length}개</span>
          <Button variant="primary" size="sm" className="ml-auto" disabled={!todayItems.some((t) => !t.item.done)} onClick={placeToday}>
            <CalendarPlus size={14} strokeWidth={1.75} />
            캘린더에 배치
          </Button>
        </div>
        {todayItems.length === 0 ? (
          <p className="mt-3 text-body-md text-on-surface-variant">과목 카드에서 📅 버튼으로 공부할 날을 정하면 여기에 모여요.</p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {todayItems.map(({ item, subject }) => {
              const late = item.planDate && daysFromToday(fromDateKey(item.planDate)) < 0
              return (
                <li key={item.id} className="flex items-center gap-2.5 rounded border bg-background px-3 py-2.5">
                  <Checkbox
                    checked={item.done}
                    onChange={() => examActions.toggleItem({ examId: exam.id, subjectId: subject.id, itemId: item.id })}
                    label={`${item.title} 완료`}
                  />
                  <SubjectChip name={subject.name} />
                  <span className={`flex-1 text-body-md ${item.done ? 'text-placeholder line-through' : ''}`}>{item.title}</span>
                  {late && <span className="text-label-md text-urgent">밀림</span>}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 과목 거르기 + 과목 카드 */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[{ id: null, name: `전체 과목 (${exam.subjects.length})` }, ...exam.subjects.map((s) => ({ id: s.id, name: s.name }))].map((s) => (
          <button
            key={s.id ?? 'all'}
            type="button"
            onClick={() => setSubjectFilter(s.id)}
            className={`h-8 rounded-full border px-3 text-label-md ${
              subjectFilter === s.id ? 'border-button bg-button text-on-primary' : 'border-field-border text-on-surface-variant hover:bg-hover-soft'
            }`}
          >
            {s.name}
          </button>
        ))}
        <Button size="sm" className="ml-auto" onClick={() => setDialog({ kind: 'subject' })}>
          <Plus size={14} strokeWidth={2} />
          과목 추가
        </Button>
      </div>
      {subjects.length === 0 ? (
        <p className="rounded-lg border border-dashed py-10 text-center text-body-md text-placeholder">과목을 추가해 보세요.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} exam={exam} subject={subject} onEdit={() => setDialog({ kind: 'subject', subjectId: subject.id })} />
          ))}
        </div>
      )}

      <PastExams past={past} open={pastOpen} onToggle={() => setPastOpen((v) => !v)} />
      {dialogs}
    </div>
  )
}

/** 지난 시험 기록 — 끝난 시험의 최종 진도 */
function PastExams({ past, open, onToggle }: { past: Exam[]; open: boolean; onToggle: () => void }) {
  if (past.length === 0) return null
  return (
    <section className="rounded-lg border bg-surface-container-low">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2 p-4 text-left">
        <h2 className="text-headline-sm">지난 시험 기록</h2>
        <span className="rounded-sm bg-surface-container px-1.5 text-label-md tabular-nums text-on-surface-variant">{past.length}</span>
        <ChevronDown size={18} strokeWidth={1.75} className={`ml-auto text-icon ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="space-y-2 px-4 pb-4">
          {past.map((e) => {
            const p = examProgress(e)
            return (
              <li key={e.id} className="flex items-center gap-3 rounded border bg-surface-container-lowest px-4 py-3">
                <span className="flex-1 text-body-md">{e.name}</span>
                <span className="text-body-sm text-on-surface-variant">
                  {formatDateKey(e.startDate)} ~ {formatDateKey(e.endDate)}
                </span>
                <span className="text-label-md tabular-nums">진도 {p.percent}%</span>
                <button type="button" onClick={() => examActions.removeExam(e.id)} className="rounded px-2 py-1 text-label-md text-error hover:bg-error-container/50">
                  삭제
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
