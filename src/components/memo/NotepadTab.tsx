// 단순 메모장 — Obsidian으로 보내지 않는 앱 안 메모. 목록·검색(#태그)·편집·자동 저장. 폰에서는 목록과 편집을 번갈아 보여준다
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { noteActions, tagsOf } from '../../hooks/useMemos.ts'
import { useIsMobile } from '../../hooks/useIsMobile.ts'
import { useStore } from '../../hooks/useStore.ts'
import { daysFromToday, formatMonthDay, formatTime, fromUtc } from '../../lib/date.ts'
import { notesStore } from '../../lib/stores.ts'
import type { Note } from '../../types/data.ts'
import Button from '../common/Button.tsx'

function updatedText(iso: string) {
  const dt = fromUtc(iso)
  return daysFromToday(dt) === 0 ? formatTime(dt) : formatMonthDay(dt)
}

/** 검색: '#태그'로 시작하면 태그만, 아니면 제목·본문에서 찾는다 */
function matches(note: Note, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  if (q.startsWith('#')) return tagsOf(note.body).some((t) => t.includes(q.slice(1)))
  return `${note.title}\n${note.body}`.toLowerCase().includes(q.toLowerCase())
}

export default function NotepadTab() {
  const [notes] = useStore(notesStore)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isMobile = useIsMobile()

  const sorted = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const shown = sorted.filter((n) => matches(n, query))
  // 데스크톱은 고른 게 없으면 맨 위 메모를 연다
  const selected = notes.find((n) => n.id === selectedId) ?? (isMobile ? undefined : shown[0])

  function create() {
    setQuery('')
    setSelectedId(noteActions.add())
  }

  const list = (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <label className="flex h-[38px] flex-1 items-center gap-2 rounded border border-field-border bg-surface-container-lowest px-3">
          <Search size={16} strokeWidth={1.75} className="text-placeholder" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="내용 또는 #태그로 찾기"
            className="min-w-0 flex-1 bg-transparent text-body-md placeholder:text-placeholder focus:outline-none"
          />
        </label>
        <Button variant="primary" onClick={create} aria-label="새 메모">
          <Plus size={16} strokeWidth={2} />
        </Button>
      </div>
      <ul className="space-y-2">
        {shown.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => setSelectedId(note.id)}
              className={`block w-full rounded-md border p-3 text-left transition-colors ${
                selected?.id === note.id ? 'border-primary-container/40 bg-surface-container-high' : 'bg-surface-container-lowest hover:bg-hover-soft'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-headline-sm">{note.title || '제목 없음'}</span>
                <span className="shrink-0 text-body-sm text-on-surface-variant">{updatedText(note.updatedAt)}</span>
              </span>
              <span className="mt-1 line-clamp-2 block text-body-sm text-on-surface-variant">{note.body || '내용 없음'}</span>
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="py-8 text-center text-body-sm text-placeholder">{query ? '찾는 메모가 없어요' : '메모가 없어요'}</li>}
      </ul>
    </div>
  )

  const editor = selected ? (
    <NoteEditor key={selected.id} note={selected} onBack={isMobile ? () => setSelectedId(null) : undefined} onDeleted={() => setSelectedId(null)} />
  ) : (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-body-md text-placeholder">
      메모를 고르거나 새로 만들어 보세요
    </div>
  )

  if (isMobile) return selected ? editor : list
  return (
    <div className="grid grid-cols-[320px_1fr] gap-6">
      {list}
      {editor}
    </div>
  )
}

function NoteEditor({ note, onBack, onDeleted }: { note: Note; onBack?: () => void; onDeleted: () => void }) {
  const tags = tagsOf(note.body)

  return (
    <section className="flex min-h-[480px] flex-col rounded-lg border bg-surface-container-lowest shadow-card">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="목록으로" className="flex size-8 items-center justify-center rounded text-icon hover:bg-hover">
            <ArrowLeft size={18} strokeWidth={1.75} />
          </button>
        )}
        <span className="text-body-sm text-on-surface-variant">자동 저장됨 · {updatedText(note.updatedAt)}</span>
        <button
          type="button"
          onClick={() => {
            noteActions.remove(note.id)
            onDeleted()
          }}
          aria-label="메모 지우기"
          className="ml-auto flex size-8 items-center justify-center rounded text-icon hover:bg-hover"
        >
          <Trash2 size={16} strokeWidth={1.75} />
        </button>
      </div>
      <input
        autoFocus={!note.title && !note.body}
        value={note.title}
        onChange={(e) => noteActions.update(note.id, { title: e.target.value })}
        placeholder="제목"
        className="px-5 pt-4 text-headline-lg placeholder:text-placeholder focus:outline-none"
      />
      <textarea
        value={note.body}
        onChange={(e) => noteActions.update(note.id, { body: e.target.value })}
        placeholder="내용을 쓰면 바로 저장돼요. #태그를 넣으면 태그로 찾을 수 있어요."
        className="flex-1 resize-none px-5 py-3 text-body-lg placeholder:text-placeholder focus:outline-none"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t px-5 py-3">
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-container px-2 py-0.5 text-label-md text-on-surface-variant">
              #{t}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
