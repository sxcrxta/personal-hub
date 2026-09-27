// 수행평가 추가·수정 창 — 제목, 과목, 마감 날짜·시각, 메모, 준비 단계
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { assignmentActions } from '../../hooks/useStudy.ts'
import { newId } from '../../lib/storage.ts'
import { shiftDateKey, todayKey } from '../../lib/date.ts'
import type { Assignment } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import Dialog from '../common/Dialog.tsx'
import { Field, TextArea, TextInput } from '../common/Field.tsx'

type Props = {
  assignment?: Assignment
  subjects: string[] // 이미 쓴 과목 이름 (고르기 쉽게)
  onClose: () => void
}

export default function AssignmentDialog({ assignment, subjects, onClose }: Props) {
  const [title, setTitle] = useState(assignment?.title ?? '')
  const [subject, setSubject] = useState(assignment?.subject ?? '')
  const [dueDate, setDueDate] = useState(assignment?.dueDate ?? shiftDateKey(todayKey(), 7))
  const [dueTime, setDueTime] = useState(assignment?.dueTime ?? '')
  const [memo, setMemo] = useState(assignment?.memo ?? '')
  const [steps, setSteps] = useState(assignment?.steps ?? [])
  const [stepText, setStepText] = useState('')
  const invalid = !title.trim() || !subject.trim() || !dueDate

  function addStep() {
    if (!stepText.trim()) return
    setSteps((s) => [...s, { id: newId(), title: stepText.trim(), done: false }])
    setStepText('')
  }

  function save() {
    if (invalid) return
    const data = { title: title.trim(), subject: subject.trim(), dueDate, dueTime: dueTime || undefined, memo: memo.trim() || undefined, steps }
    if (assignment) assignmentActions.update(assignment.id, data)
    else assignmentActions.add(data)
    onClose()
  }

  return (
    <Dialog open onClose={onClose} title={assignment ? '수행평가 고치기' : '수행평가 추가'}>
      <div className="flex flex-col gap-4">
        <Field label="제목">
          <TextInput autoFocus value={title} placeholder="예: 역학적 에너지 실험 보고서" onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="과목">
          <TextInput list="assignment-subjects" value={subject} placeholder="예: 물리학Ⅰ" onChange={(e) => setSubject(e.target.value)} />
          <datalist id="assignment-subjects">
            {subjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="마감 날짜">
            <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="마감 시각 (선택)">
            <TextInput type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </Field>
        </div>
        <Field label="메모">
          <TextArea rows={2} value={memo} placeholder="제출 방법, 분량 등" onChange={(e) => setMemo(e.target.value)} />
        </Field>
        <div>
          <span className="mb-1.5 block text-label-md text-on-surface-variant">준비 단계</span>
          <ol className="space-y-1.5">
            {steps.map((step, i) => (
              <li key={step.id} className="flex items-center gap-2 text-body-md">
                <span className="w-5 text-on-surface-variant tabular-nums">{i + 1}.</span>
                <span className="flex-1">{step.title}</span>
                <button type="button" onClick={() => setSteps((s) => s.filter((x) => x.id !== step.id))} aria-label={`${step.title} 빼기`} className="flex size-6 items-center justify-center rounded text-placeholder hover:bg-hover">
                  <X size={14} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex gap-2">
            <TextInput
              value={stepText}
              placeholder="단계 추가 (예: 자료 조사)"
              onChange={(e) => setStepText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && addStep()}
            />
            <Button onClick={addStep} disabled={!stepText.trim()} aria-label="단계 추가">
              <Plus size={16} strokeWidth={2} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t pt-4">
          {assignment && (
            <Button
              variant="danger"
              onClick={() => {
                assignmentActions.remove(assignment.id)
                onClose()
              }}
            >
              삭제
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" onClick={save} disabled={invalid}>
              저장
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
