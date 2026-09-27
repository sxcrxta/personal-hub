// 시험 등록·수정 창 — 이름과 시험 기간
import { useState } from 'react'
import { examActions } from '../../hooks/useStudy.ts'
import { shiftDateKey, todayKey } from '../../lib/date.ts'
import type { Exam } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import Dialog from '../common/Dialog.tsx'
import { Field, TextInput } from '../common/Field.tsx'

type Props = {
  exam?: Exam
  onClose: () => void
  onCreated?: (id: string) => void
}

export default function ExamDialog({ exam, onClose, onCreated }: Props) {
  const [name, setName] = useState(exam?.name ?? '')
  const [startDate, setStartDate] = useState(exam?.startDate ?? shiftDateKey(todayKey(), 14))
  const [endDate, setEndDate] = useState(exam?.endDate ?? shiftDateKey(todayKey(), 17))
  const invalid = !name.trim() || !startDate || !endDate || endDate < startDate

  function save() {
    if (invalid) return
    const data = { name: name.trim(), startDate, endDate }
    if (exam) examActions.updateExam(exam.id, data)
    else onCreated?.(examActions.addExam(data))
    onClose()
  }

  return (
    <Dialog open onClose={onClose} title={exam ? '시험 고치기' : '새 시험 등록'}>
      <div className="flex flex-col gap-4">
        <Field label="시험 이름">
          <TextInput autoFocus value={name} placeholder="예: 2학기 기말고사" onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="첫날">
            <TextInput
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (e.target.value > endDate) setEndDate(e.target.value)
              }}
            />
          </Field>
          <Field label="마지막 날">
            <TextInput type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        {endDate < startDate && <p className="-mt-2 text-body-sm text-error">마지막 날이 첫날보다 빠를 수 없어요</p>}
        <div className="flex items-center gap-2 border-t pt-4">
          {exam && (
            <Button
              variant="danger"
              onClick={() => {
                examActions.removeExam(exam.id)
                onClose()
              }}
            >
              시험 삭제
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
