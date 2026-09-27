// 예전 노트 다시 보기 카드 — 볼트에서 골라 온 노트 하나를 보여주고, 다른 노트로 바꾸거나 전체를 읽는다
import { Maximize2, NotebookText, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { daysFromToday, formatDotDate, fromDateKey } from '../../lib/date.ts'
import { useTodayNote } from '../../hooks/useTodayNote.ts'
import Markdown from '../common/Markdown.tsx'
import NoteViewerDialog from './NoteViewerDialog.tsx'

export default function ResurfaceNoteCard() {
  const { note, canShowAnother, showAnother } = useTodayNote()
  const [viewerOpen, setViewerOpen] = useState(false)

  return (
    <section className="rounded-lg border bg-surface-container-lowest p-5 shadow-card md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded bg-english-bg text-english">
            <NotebookText size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-label-sm tracking-wider text-outline uppercase">Obsidian</p>
            <h2 className="text-headline-sm">예전 노트 다시 보기</h2>
          </div>
        </div>
        {note && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={showAnother}
              disabled={!canShowAnother}
              className="flex h-8 items-center gap-1.5 rounded border border-field-border px-3 text-label-md text-primary-container transition-colors hover:bg-hover-soft disabled:opacity-40"
            >
              <Shuffle size={14} strokeWidth={1.75} />
              다른 노트 보기
            </button>
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded border border-field-border px-3 text-label-md text-primary-container transition-colors hover:bg-hover-soft"
            >
              <Maximize2 size={14} strokeWidth={1.75} />
              전체 보기
            </button>
          </div>
        )}
      </div>

      {note ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <h3 className="text-headline-md">{note.title}</h3>
            {note.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-surface-container px-2 py-0.5 text-label-md text-on-surface-variant">
                #{tag}
              </span>
            ))}
          </div>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {formatDotDate(fromDateKey(note.createdAt))}에 씀 · {-daysFromToday(fromDateKey(note.createdAt))}일 전 · {note.path}
          </p>
          {/* 미리보기: 길면 아래를 흐리게 자른다 */}
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="relative mt-4 block max-h-48 w-full overflow-hidden rounded border bg-surface-container-low p-4 text-left"
          >
            <Markdown source={note.content} />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-container-low" />
          </button>
          <NoteViewerDialog note={note} open={viewerOpen} onClose={() => setViewerOpen(false)} />
        </>
      ) : (
        <p className="mt-5 text-body-md text-on-surface-variant">
          아직 가져온 노트가 없어요. 맥북 프로그램이 켜지면 볼트에서 노트를 골라 와요.
        </p>
      )}
    </section>
  )
}
