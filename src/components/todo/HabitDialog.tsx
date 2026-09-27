// 습관 추가·수정 창 — 이름, 이모지, 하는 요일, 알림 시각
import { useState } from 'react'
import { habitActions } from '../../hooks/useHabits.ts'
import { WEEKDAY_LABELS } from '../../lib/date.ts'
import { emojiOf } from '../../lib/nameStyle.ts'
import type { Habit } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import Dialog from '../common/Dialog.tsx'
import EmojiPicker from '../common/EmojiPicker.tsx'
import { Field, TextInput } from '../common/Field.tsx'

type Props = {
  habit?: Habit // 없으면 새 습관
  open: boolean
  onClose: () => void
}

export default function HabitDialog({ habit, open, onClose }: Props) {
  const [name, setName] = useState(habit?.name ?? '')
  const [emoji, setEmoji] = useState(habit?.emoji ?? '⭐')
  const [emojiTouched, setEmojiTouched] = useState(!!habit)
  const [days, setDays] = useState<number[]>(habit?.days ?? [1, 2, 3, 4, 5, 6, 7])
  const [alarmTime, setAlarmTime] = useState(habit?.alarmTime ?? '')

  function save() {
    if (!name.trim() || !days.length) return
    const data = { name: name.trim(), emoji, days: [...days].sort(), alarmTime: alarmTime || undefined }
    if (habit) habitActions.update(habit.id, data)
    else habitActions.add(data)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={habit ? '습관 고치기' : '새 습관'}>
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
            <Field label="이름">
              <TextInput
                autoFocus
                value={name}
                placeholder="예: 물 1.5L 마시기"
                onChange={(e) => {
                  setName(e.target.value)
                  // 이모지를 직접 고르기 전까지는 이름에 맞춰 자동으로
                  if (!emojiTouched && e.target.value.trim()) setEmoji(emojiOf(e.target.value))
                }}
              />
            </Field>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-label-md text-on-surface-variant">하는 요일</span>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, i) => {
              const day = i + 1
              const on = days.includes(day)
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDays((d) => (on ? d.filter((x) => x !== day) : [...d, day]))}
                  className={`size-9 rounded-full border text-label-md ${
                    on ? 'border-primary-container bg-primary-container text-on-primary' : 'border-field-border text-on-surface-variant'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <Field label="알림 시각 (선택)">
          <TextInput type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} />
        </Field>

        <div className="flex items-center gap-2 border-t pt-4">
          {habit && (
            <Button
              variant="danger"
              onClick={() => {
                habitActions.remove(habit.id)
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
            <Button variant="primary" onClick={save} disabled={!name.trim() || !days.length}>
              저장
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
