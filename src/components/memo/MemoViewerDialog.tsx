// 보낸 메모 보기 창 — 마크다운 서식 그대로, 처리 상태와 만들어진 파일 경로
import { formatDotDate, formatTime, fromUtc } from '../../lib/date.ts'
import type { Memo } from '../../types/data.ts'
import Dialog from '../common/Dialog.tsx'
import Markdown from '../common/Markdown.tsx'
import { STATUS_CLASS, STATUS_LABEL } from './memoStatus.ts'

export default function MemoViewerDialog({ memo, onClose }: { memo: Memo; onClose: () => void }) {
  const created = fromUtc(memo.createdAt)
  return (
    <Dialog open onClose={onClose} size="lg" title={`메모 ${memo.id}번`}>
      <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
        <span className={`rounded-full border px-2 py-0.5 text-label-md ${STATUS_CLASS[memo.status]}`}>{STATUS_LABEL[memo.status]}</span>
        <span>
          {formatDotDate(created)} {formatTime(created)} · {memo.saveMode === '원문' ? '그대로 저장' : 'AI 정제'}
        </span>
      </div>
      <p className="mt-2 text-body-sm text-on-surface-variant">
        {memo.notePath ? `볼트 파일: ${memo.notePath}` : `아직 볼트에 없어요. ${memo.targetFolder} 폴더에 만들어질 예정이에요.`}
      </p>
      {memo.errorMessage && <p className="mt-1 text-body-sm text-error">실패 이유: {memo.errorMessage}</p>}
      {memo.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {memo.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-container px-2 py-0.5 text-label-md text-on-surface-variant">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5">
        <Markdown source={memo.content} />
      </div>
    </Dialog>
  )
}
