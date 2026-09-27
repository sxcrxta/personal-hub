// 수행평가·과제 탭 — 오늘 할 수행평가(오늘·내일 마감), 마감이 가까운 과제(7일), 나중 과제, 제출 완료
import { ChevronDown, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAssignments, useExams } from '../../hooks/useStudy.ts'
import { assignmentGroup, type AssignmentGroup } from '../../lib/studyRules.ts'
import type { Assignment } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import AssignmentCard from './AssignmentCard.tsx'
import AssignmentDialog from './AssignmentDialog.tsx'

const SECTIONS: { id: Exclude<AssignmentGroup, 'done'>; title: string; empty: string }[] = [
  { id: 'urgent', title: '오늘 할 수행평가', empty: '오늘·내일 마감인 과제가 없어요.' },
  { id: 'soon', title: '마감이 가까운 과제', empty: '일주일 안에 마감인 과제가 없어요.' },
  { id: 'later', title: '나중 과제', empty: '' },
]

export default function AssignmentTab({ focusId }: { focusId: string | null }) {
  const assignments = useAssignments()
  const exams = useExams()
  const [editing, setEditing] = useState<Assignment | 'new' | null>(null)
  const [doneOpen, setDoneOpen] = useState(false)

  const byDue = [...assignments].sort((a, b) => `${a.dueDate}${a.dueTime ?? '99'}`.localeCompare(`${b.dueDate}${b.dueTime ?? '99'}`))
  const groups = (g: AssignmentGroup) => byDue.filter((a) => assignmentGroup(a) === g)
  const subjectNames = [...new Set([...assignments.map((a) => a.subject), ...exams.flatMap((e) => e.subjects.map((s) => s.name))])]

  // 캘린더에서 마감을 눌러 들어오면 그 카드로 스크롤
  useEffect(() => {
    if (focusId) document.getElementById(`assignment-${focusId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusId])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <p className="text-body-md text-on-surface-variant">
          남은 과제 <b className="font-semibold text-on-surface tabular-nums">{assignments.filter((a) => !a.done).length}</b>개
        </p>
        <Button variant="primary" className="ml-auto" onClick={() => setEditing('new')}>
          <Plus size={16} strokeWidth={2} />
          수행평가 추가
        </Button>
      </div>

      {SECTIONS.map((section) => {
        const list = groups(section.id)
        if (section.id === 'later' && list.length === 0) return null
        return (
          <section key={section.id} className="flex flex-col gap-3">
            <h2 className={`flex items-center gap-2 text-headline-sm ${section.id === 'urgent' ? 'text-urgent' : ''}`}>
              {section.id === 'urgent' && <span className="size-2 rounded-full bg-urgent" />}
              {section.title}
              <span className="text-body-sm font-normal text-on-surface-variant tabular-nums">{list.length}</span>
            </h2>
            {list.length === 0 ? (
              <p className="rounded-lg border border-dashed py-6 text-center text-body-sm text-placeholder">{section.empty}</p>
            ) : (
              list.map((a) => (
                <AssignmentCard key={a.id} assignment={a} group={section.id} highlighted={a.id === focusId} onEdit={() => setEditing(a)} />
              ))
            )}
          </section>
        )
      })}

      <section className="rounded-lg border bg-surface-container-low">
        <button type="button" onClick={() => setDoneOpen((v) => !v)} aria-expanded={doneOpen} className="flex w-full items-center gap-2 p-4 text-left">
          <h2 className="text-headline-sm">제출 완료</h2>
          <span className="rounded-sm bg-surface-container px-1.5 text-label-md tabular-nums text-on-surface-variant">{groups('done').length}</span>
          <ChevronDown size={18} strokeWidth={1.75} className={`ml-auto text-icon ${doneOpen ? 'rotate-180' : ''}`} />
        </button>
        {doneOpen && (
          <div className="flex flex-col gap-3 px-4 pb-4">
            {groups('done').map((a) => (
              <AssignmentCard key={a.id} assignment={a} group="done" highlighted={false} onEdit={() => setEditing(a)} />
            ))}
          </div>
        )}
      </section>

      {editing && (
        <AssignmentDialog
          key={editing === 'new' ? 'new' : editing.id}
          assignment={editing === 'new' ? undefined : editing}
          subjects={subjectNames}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
