// 최근 보낸 메모 5개 — 처리 상태와 만들어진 파일 경로. 누르면 전체 보기, 실패하면 다시 시도, 검토 필요면 검토 창
import { FileText, History, PenLine, RotateCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { memoActions } from '../../hooks/useMemos.ts'
import { formatTime, fromUtc, daysFromToday, formatMonthDay } from '../../lib/date.ts'
import type { Memo } from '../../types/data.ts'
import MemoReviewDialog from './MemoReviewDialog.tsx'
import MemoViewerDialog from './MemoViewerDialog.tsx'
import { STATUS_CLASS, STATUS_LABEL } from './memoStatus.ts'

function whenText(iso: string): string {
  const dt = fromUtc(iso)
  const days = daysFromToday(dt)
  return days === 0 ? `오늘 ${formatTime(dt)}` : days === -1 ? `어제 ${formatTime(dt)}` : formatMonthDay(dt)
}

export default function RecentMemos({ memos }: { memos: Memo[] }) {
  const [viewing, setViewing] = useState<Memo | null>(null)
  const [reviewing, setReviewing] = useState<Memo | null>(null)
  const recent = [...memos].sort((a, b) => b.id - a.id).slice(0, 5)
  const waiting = memos.filter((m) => ['대기중', '정제대기', '저장대기'].includes(m.status)).length
  // 최근 5개 밖으로 밀려난 것도 놓치지 않게 오래된 것부터 위에 알린다
  const toReview = memos.filter((m) => m.status === '검토대기').sort((a, b) => a.id - b.id)
  const open = (memo: Memo) => (memo.status === '검토대기' ? setReviewing(memo) : setViewing(memo))

  return (
    // min-w-0: 격자 칸 안에서 긴 파일 경로·안내 글 때문에 폰 화면보다 넓어지지 않게
    <section className="min-w-0 rounded-lg border bg-surface-container-lowest p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-headline-sm">
          <History size={18} strokeWidth={1.75} className="text-icon" />
          최근 보낸 메모
        </h2>
        <span className="text-body-sm text-on-surface-variant tabular-nums">대기 {waiting}개</span>
      </div>

      {toReview.length > 0 && (
        <button
          type="button"
          onClick={() => setReviewing(toReview[0])}
          className="mt-4 flex w-full items-center gap-3 rounded-md border border-primary-container bg-primary-container px-4 py-3 text-left text-on-primary"
        >
          <PenLine size={18} strokeWidth={1.75} className="shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-headline-sm">검토할 메모 {toReview.length}개</span>
            <span className="block truncate text-body-sm opacity-80">AI가 정리했어요. 원문과 비교하고 고쳐서 저장해 주세요</span>
          </span>
          <span className="shrink-0 text-label-md">검토하기</span>
        </button>
      )}

      {recent.length === 0 ? (
        <p className="mt-4 text-body-md text-on-surface-variant">아직 보낸 메모가 없어요.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recent.map((memo) => (
            <li key={memo.id} className="rounded-md border bg-background p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-label-md ${STATUS_CLASS[memo.status]}`}>
                  {STATUS_LABEL[memo.status]}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  {memo.id}번 · {whenText(memo.createdAt)}
                </span>
              </div>
              <button type="button" onClick={() => open(memo)} className="mt-2 block w-full text-left">
                <p className="line-clamp-2 text-body-md">{memo.content}</p>
              </button>
              <div className="mt-2 flex items-center gap-2 border-t pt-2 text-body-sm text-on-surface-variant">
                <FileText size={13} strokeWidth={1.75} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{memo.notePath ?? `${memo.targetFolder} (아직 볼트에 없음)`}</span>
                {memo.status === '검토대기' && (
                  <button
                    type="button"
                    onClick={() => setReviewing(memo)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-label-md text-on-surface hover:bg-hover"
                  >
                    <PenLine size={13} strokeWidth={2} />
                    검토하기
                  </button>
                )}
                {memo.status === '실패' && (
                  <button
                    type="button"
                    onClick={() => memoActions.retry(memo.id)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-label-md text-urgent hover:bg-urgent-bg"
                  >
                    <RotateCw size={13} strokeWidth={2} />
                    다시 시도
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => memoActions.remove(memo.id)}
                  aria-label={`메모 ${memo.id}번 지우기`}
                  title="웹에서만 지워요. 볼트 노트는 Obsidian에서 지워 주세요"
                  className="flex size-6 items-center justify-center rounded hover:bg-hover"
                >
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-body-sm text-on-surface-variant">웹에서 메모를 지워도 이미 만들어진 볼트 노트는 남아요.</p>
      {viewing && <MemoViewerDialog memo={viewing} onClose={() => setViewing(null)} />}
      {reviewing && <MemoReviewDialog key={reviewing.id} memo={reviewing} onClose={() => setReviewing(null)} />}
    </section>
  )
}
