// 예전 노트 전체 보기 창 — 마크다운 서식 그대로 읽는다 (읽기만, 고치기는 Obsidian에서)
import { formatDotDate, fromDateKey } from '../../lib/date.ts'
import type { VaultNote } from '../../types/data.ts'
import Dialog from '../common/Dialog.tsx'
import Markdown from '../common/Markdown.tsx'

type Props = {
  note: VaultNote
  open: boolean
  onClose: () => void
}

export default function NoteViewerDialog({ note, open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} size="lg" title={note.title}>
      <p className="text-body-sm text-on-surface-variant">
        {formatDotDate(fromDateKey(note.createdAt))} · {note.path}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {note.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-surface-container px-2 py-0.5 text-label-md text-on-surface-variant">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-5">
        <Markdown source={note.content} />
      </div>
    </Dialog>
  )
}
