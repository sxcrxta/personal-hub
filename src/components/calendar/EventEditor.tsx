// 일정 상세 편집 — 제목·카테고리·날짜·시각·장소·메모, 연결된 할 일·공부 항목, 지우기·저장
import { ArrowRight, BookOpen, CircleCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { eventActions } from '../../hooks/useEvents.ts'
import { useStore } from '../../hooks/useStore.ts'
import { categoriesStore, todosStore } from '../../lib/stores.ts'
import { paletteOf } from '../../lib/subjectColor.ts'
import { showToast } from '../../lib/toast.ts'
import Button from '../common/Button.tsx'
import { Field, TextArea, TextInput } from '../common/Field.tsx'
import { draftTimes, endAfterStart, type EventDraft } from './eventDraft.ts'

const CHIP: Record<string, string> = {
  math: 'border-math/40 bg-math-bg text-math',
  science: 'border-science/40 bg-science-bg text-science',
  korean: 'border-korean/40 bg-korean-bg text-korean',
  english: 'border-english/40 bg-english-bg text-english',
  social: 'border-social/40 bg-social-bg text-social',
}

type Props = {
  initial: EventDraft
  onClose: () => void
}

export default function EventEditor({ initial, onClose }: Props) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const [categories] = useStore(categoriesStore)
  const [todos] = useStore(todosStore)
  const navigate = useNavigate()
  const linkedTodo = draft.todoId ? todos.find((t) => t.id === draft.todoId) : undefined

  const set = (patch: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...patch }))

  function save() {
    const times = draftTimes(draft)
    if ('error' in times) return setError(times.error)
    const data = {
      title: draft.title.trim() || '새 일정',
      category: draft.category,
      location: draft.location.trim() || undefined,
      memo: draft.memo.trim() || undefined,
      ...times,
    }
    if (draft.id) eventActions.update(draft.id, data)
    else eventActions.add(data)
    showToast(draft.id ? '일정을 고쳤어요' : '일정을 추가했어요')
    onClose()
  }

  function createTodo() {
    if (!draft.id) return
    save()
    eventActions.createTodo(draft.id)
    showToast('할 일을 만들었어요', '할 일 보기', () => navigate('/todo'))
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="제목">
        <TextInput autoFocus value={draft.title} placeholder="새 일정" onChange={(e) => set({ title: e.target.value })} />
      </Field>

      <div>
        <span className="mb-1.5 block text-label-md text-on-surface-variant">카테고리</span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = draft.category === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => set({ category: active ? undefined : c })}
                className={`h-7 rounded-full border px-3 text-label-md ${
                  active ? CHIP[paletteOf(c)] : 'border-field-border text-on-surface-variant hover:bg-hover-soft'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <Field label="날짜">
        <TextInput type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="시작">
          <TextInput
            type="time"
            step={900}
            value={draft.startTime}
            onChange={(e) => set({ startTime: e.target.value, endTime: endAfterStart(e.target.value) })}
          />
        </Field>
        <Field label="끝">
          <TextInput type="time" step={900} value={draft.endTime} onChange={(e) => set({ endTime: e.target.value })} />
        </Field>
      </div>
      {error && <p className="-mt-2 text-body-sm text-error">{error}</p>}

      <Field label="장소">
        <TextInput value={draft.location} placeholder="예: 화학실" onChange={(e) => set({ location: e.target.value })} />
      </Field>
      <Field label="메모">
        <TextArea value={draft.memo} rows={3} onChange={(e) => set({ memo: e.target.value })} />
      </Field>

      {/* 연결된 할 일·공부 항목 */}
      {draft.studyRef ? (
        <button
          type="button"
          onClick={() => navigate('/study')}
          className="flex items-center justify-between rounded border bg-science-bg px-3 py-2.5 text-left text-body-md"
        >
          <span className="flex items-center gap-2">
            <BookOpen size={16} strokeWidth={1.75} className="text-science" />
            시험공부 항목과 연결됨
          </span>
          <ArrowRight size={16} strokeWidth={1.75} className="text-icon" />
        </button>
      ) : linkedTodo ? (
        <button
          type="button"
          onClick={() => navigate(`/todo?todo=${linkedTodo.id}`)}
          className="flex items-center justify-between rounded border bg-surface-container-low px-3 py-2.5 text-left text-body-md"
        >
          <span className="flex items-center gap-2">
            <CircleCheck size={16} strokeWidth={1.75} className="text-icon" />
            할 일과 연결됨 {linkedTodo.done && '(완료)'}
          </span>
          <ArrowRight size={16} strokeWidth={1.75} className="text-icon" />
        </button>
      ) : (
        draft.id && (
          <Button onClick={createTodo}>
            <CircleCheck size={16} strokeWidth={1.75} />이 일정으로 할 일 만들기
          </Button>
        )
      )}
      {(draft.studyRef || linkedTodo) && (
        <p className="-mt-2 text-body-sm text-on-surface-variant">제목을 바꾸면 연결된 쪽 제목도 같이 바뀌어요.</p>
      )}

      <div className="mt-2 flex items-center gap-2 border-t pt-4">
        {draft.id && (
          <Button
            variant="danger"
            onClick={() => {
              eventActions.remove(draft.id!)
              onClose()
            }}
          >
            <Trash2 size={16} strokeWidth={1.75} />
            삭제
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={save}>
            저장
          </Button>
        </div>
      </div>
    </div>
  )
}
