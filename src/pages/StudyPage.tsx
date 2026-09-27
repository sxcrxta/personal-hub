// 학업 관리 화면(/study) — '시험공부'와 '수행평가·과제' 두 탭 (?tab=assignments, &focus=과제id)
import { BookOpen, ClipboardList } from 'lucide-react'
import { useSearchParams } from 'react-router'
import AssignmentTab from '../components/study/AssignmentTab.tsx'
import ExamTab from '../components/study/ExamTab.tsx'
import { useAssignments } from '../hooks/useStudy.ts'
import { assignmentGroup } from '../lib/studyRules.ts'

export default function StudyPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'assignments' ? 'assignments' : 'exam'
  const urgent = useAssignments().filter((a) => assignmentGroup(a) === 'urgent').length

  const tabs = [
    { id: 'exam', label: '시험공부', icon: BookOpen },
    { id: 'assignments', label: '수행평가·과제', icon: ClipboardList },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      {/* 폰에서는 상단바에 화면 이름이 있어서 숨긴다 */}
      <header className="hidden items-baseline gap-3 md:flex">
        <h1 className="text-display-hero-mobile md:text-display-hero">학업 관리</h1>
        <p className="hidden text-body-md text-on-surface-variant md:block">시험 준비와 수행평가 마감</p>
      </header>

      <div role="tablist" className="flex w-fit rounded-md border bg-surface-container-low p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'exam' ? {} : { tab: t.id })}
            className={`flex h-9 items-center gap-2 rounded px-4 text-label-md ${
              tab === t.id ? 'bg-surface-container-lowest text-on-surface shadow-card' : 'text-on-surface-variant'
            }`}
          >
            <t.icon size={16} strokeWidth={1.75} />
            {t.label}
            {t.id === 'assignments' && urgent > 0 && (
              <span className="rounded-full bg-urgent-bg px-1.5 text-label-sm text-urgent tabular-nums">{urgent}건 급함</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'exam' ? <ExamTab /> : <AssignmentTab focusId={params.get('focus')} />}
    </div>
  )
}
