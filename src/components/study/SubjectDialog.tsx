// 과목 추가·수정 창 — 이름, 이모지(자동, 골라서 바꾸기), 시험일
import { useState } from 'react'
import { examActions } from '../../hooks/useStudy.ts'
import { emojiOf } from '../../lib/nameStyle.ts'
import type { Exam, ExamSubject } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import Dialog from '../common/Dialog.tsx'
import EmojiPicker from '../common/EmojiPicker.tsx'
import { Field, TextInput } from '../common/Field.tsx'

type Props = {
  exam: Exam
  subject?: ExamSubject
  onClose: () => void
}

export default function SubjectDialog({ exam, subject, onClose }: Props) {
  const [name, setName] = useState(subject?.name ?? '')
  const [emoji, setEmoji] = useState(subject?.emoji ?? '📝')
  const [emojiTouched, setEmojiTouched] = useState(!!subject)
  const [examDate, setExamDate] = useState(subject?.examDate ?? exam.startDate)

  function save() {
    if (!name.trim()) return
    const data = { name: name.trim(), emoji, examDate }
    if (subject) examActions.updateSubject(exam.id, subject.id, data)
    else examActions.addSubject(exam.id, data)
    onClose()
  }

  return (
    <Dialog open onClose={onClose} title={subject ? '과목 고치기' : '과목 추가'}>
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <EmojiPicker
            value={emoji}
            onChange={(e) => {
              setEmoji(e)
              setEmojiTouched(true)
            }}
          />
          <div className="flex-1">
            <Field label="과목 이름">
              <TextInput
                autoFocus
                value={name}
                placeholder="예: 수학Ⅱ"
                onChange={(e) => {
                  setName(e.target.value)
                  if (!emojiTouched && e.target.value.trim()) setEmoji(emojiOf(e.target.value))
                }}
              />
            </Field>
          </div>
        </div>
        <Field label="시험일">
          <TextInput type="date" value={examDate} min={exam.startDate} max={exam.endDate} onChange={(e) => setExamDate(e.target.value)} />
        </Field>
        <p className="-mt-2 text-body-sm text-on-surface-variant">색은 과목 이름에 맞춰 자동으로 붙어요.</p>
        <div className="flex items-center gap-2 border-t pt-4">
          {subject && (
            <Button
              variant="danger"
              onClick={() => {
                examActions.removeSubject(exam.id, subject.id)
                onClose()
              }}
            >
              과목 삭제
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" onClick={save} disabled={!name.trim()}>
              저장
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
