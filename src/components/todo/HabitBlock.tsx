// 습관 블록 — 할 일과 다르게 카드마다 이번 주 요일 칸을 두고, 체크하면 연속 기록이 올라간다
import { Bell, Check, Flame, Plus } from 'lucide-react'
import { useState } from 'react'
import { habitActions, useHabits } from '../../hooks/useHabits.ts'
import { thisWeekKeys, todayKey, WEEKDAY_LABELS } from '../../lib/date.ts'
import { streakOf } from '../../lib/habitRules.ts'
import type { Habit } from '../../types/data.ts'
import HabitDialog from './HabitDialog.tsx'

export default function HabitBlock() {
  const habits = useHabits()
  const [editing, setEditing] = useState<Habit | 'new' | null>(null)
  const week = thisWeekKeys()
  const today = todayKey()

  return (
    <section className="rounded-lg border bg-surface-container-lowest p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={18} strokeWidth={1.75} className="text-due-soon" />
          <h2 className="text-headline-sm">습관</h2>
          <span className="rounded-full bg-secondary-container px-2 py-0.5 text-label-md text-secondary">{habits.length}개</span>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="flex items-center gap-1 rounded px-2 py-1 text-label-md text-on-surface-variant hover:bg-hover"
        >
          <Plus size={16} strokeWidth={1.75} />새 습관
        </button>
      </div>

      {habits.length === 0 ? (
        <p className="mt-4 text-body-md text-on-surface-variant">매일 하고 싶은 일을 습관으로 만들어 보세요.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {habits.map((habit) => {
            const streak = streakOf(habit)
            return (
              <article key={habit.id} className="rounded-md border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setEditing(habit)} className="flex min-w-0 items-start gap-2 text-left">
                    <span className="text-headline-md">{habit.emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-headline-sm">{habit.name}</span>
                      {habit.alarmTime && (
                        <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
                          <Bell size={12} strokeWidth={1.75} />
                          {habit.alarmTime}
                        </span>
                      )}
                    </span>
                  </button>
                  {streak > 0 && (
                    <span className="shrink-0 rounded-full border border-due-soon/30 bg-social-bg px-2 py-0.5 text-label-md text-due-soon tabular-nums">
                      {streak}일 연속
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1 border-t pt-3">
                  {week.map((key, i) => {
                    const scheduled = habit.days.includes(i + 1)
                    const done = habit.logs.includes(key)
                    const future = key > today
                    return (
                      <div key={key} className="flex flex-col items-center gap-1">
                        <span className={`text-label-sm ${key === today ? 'text-primary' : 'text-placeholder'}`}>{WEEKDAY_LABELS[i]}</span>
                        <button
                          type="button"
                          disabled={!scheduled || future}
                          aria-pressed={done}
                          aria-label={`${habit.name} ${WEEKDAY_LABELS[i]}요일`}
                          onClick={() => habitActions.toggleDay(habit.id, key)}
                          className={`flex size-7 items-center justify-center rounded-full border transition-colors ${
                            done
                              ? 'border-primary-container bg-primary-container text-on-primary'
                              : !scheduled
                                ? 'border-transparent bg-surface-container'
                                : key === today
                                  ? 'border-primary-container hover:bg-hover'
                                  : 'border-field-border hover:bg-hover disabled:opacity-40'
                          }`}
                        >
                          {done && <Check size={14} strokeWidth={2.5} />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {editing && (
        <HabitDialog
          key={editing === 'new' ? 'new' : editing.id}
          habit={editing === 'new' ? undefined : editing}
          open
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
