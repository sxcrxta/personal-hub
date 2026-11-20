// 할 일 편집 창의 알림 칸 — 걸어 둔 알림 목록, 마감에 맞춘 알림 고르기, 시각 직접 고르기, 알림이 온 뒤 미루기
import { AlarmClock, Bell, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { fromDateAndTime, now, toUtc } from '../../lib/date.ts'
import { canSnooze, describeReminder, reminderChoices, snoozeChoices, sortReminders, type ReminderChoice } from '../../lib/reminderRules.ts'
import { showToast } from '../../lib/toast.ts'
import type { Reminder, Todo } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import { TextInput } from '../common/Field.tsx'

type Props = {
  todo: Todo // 편집 중인 값 (마감·알림)
  onChange: (reminders: Reminder[]) => void
  onSnooze: (choice: ReminderChoice) => void
}

export default function ReminderSection({ todo, onChange, onSnooze }: Props) {
  const reminders = sortReminders(todo.reminders ?? [])
  const choices = reminderChoices(todo, reminders)
  const [custom, setCustom] = useState('')

  const add = (at: string) => onChange([...reminders, { id: crypto.randomUUID(), at }])

  function addCustom() {
    if (!custom) return
    const at = fromDateAndTime(custom.slice(0, 10), custom.slice(11, 16))
    if (!at.isValid || at <= now()) {
      showToast('지금보다 뒤의 시각을 골라 주세요')
      return
    }
    add(toUtc(at))
    setCustom('')
  }

  return (
    <div>
      <span className="mb-1.5 block text-label-md text-on-surface-variant">알림</span>
      <div className="space-y-3 rounded border bg-surface-container-low p-3">
        {canSnooze(todo) && (
          <div className="space-y-2 rounded border bg-surface-container-lowest p-3">
            <p className="flex items-center gap-1.5 text-body-sm font-medium">
              <AlarmClock size={15} strokeWidth={1.75} />
              알림 미루기
            </p>
            <div className="flex flex-wrap gap-2">
              {snoozeChoices().map((c) => (
                <Button key={c.label} size="sm" variant="primary" onClick={() => onSnooze(c)}>
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {reminders.length ? (
          <ul className="space-y-1">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-body-md">
                <Bell size={15} strokeWidth={1.75} className="shrink-0 text-icon" />
                <span className="min-w-0 flex-1">{describeReminder(r, todo)}</span>
                <button
                  type="button"
                  aria-label="알림 지우기"
                  title="알림 지우기"
                  onClick={() => onChange(reminders.filter((x) => x.id !== r.id))}
                  className="flex size-7 items-center justify-center rounded text-icon hover:bg-hover"
                >
                  <X size={15} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-on-surface-variant">
            {todo.dueDate ? '아직 알림이 없어요.' : '마감을 정하면 마감에 맞춰 고를 수 있어요. 시각을 직접 골라도 돼요.'}
          </p>
        )}

        {choices.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {choices.map((c) => (
              <Button key={c.label} size="sm" onClick={() => add(c.at)}>
                <Plus size={14} strokeWidth={1.75} />
                {c.label}
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <TextInput
            type="datetime-local"
            aria-label="알림 시각 직접 고르기"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <Button onClick={addCustom} disabled={!custom}>
            추가
          </Button>
        </div>
        <p className="text-body-sm text-on-surface-variant">설정에서 알림을 켠 기기로 와요.</p>
      </div>
    </div>
  )
}
