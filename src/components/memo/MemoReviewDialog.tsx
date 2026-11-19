// 저장 전 검토 창 — 원문과 AI 정제 결과를 비교하고, 제목·본문을 직접 고쳐 저장한다. 폰에서는 탭으로 바꿔 보고, 넓은 화면에서는 나란히 본다
// 웹은 파일을 만들지 않는다. 고친 글을 DB에 '저장대기'로 남기면 플러그인이 그 글 그대로 노트를 만든다 (architecture.md 2-2절)
import { RotateCcw, Save, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { memoActions } from '../../hooks/useMemos.ts'
import { showToast } from '../../lib/toast.ts'
import type { Memo } from '../../types/data.ts'
import Button from '../common/Button.tsx'
import Dialog from '../common/Dialog.tsx'
import { inputClass } from '../common/Field.tsx'
import Markdown from '../common/Markdown.tsx'
import MarkdownToolbar from './MarkdownToolbar.tsx'

type Tab = '원문' | 'AI'

export default function MemoReviewDialog({ memo, onClose }: { memo: Memo; onClose: () => void }) {
  const [title, setTitle] = useState(memo.draftTitle ?? '')
  const [body, setBody] = useState(memo.draftBody ?? '')
  const [tab, setTab] = useState<Tab>('AI')
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const edited = title !== (memo.draftTitle ?? '') || body !== (memo.draftBody ?? '')

  function close() {
    if (edited && !busy && !window.confirm('고친 내용이 저장되지 않아요. 닫을까요?')) return
    onClose()
  }

  async function run(action: () => Promise<boolean>, done: string, confirmText?: string) {
    if (busy) return
    if (confirmText && edited && !window.confirm(confirmText)) return
    setBusy(true)
    try {
      const ok = await action()
      showToast(ok ? done : '이미 다른 곳에서 처리된 메모예요. 목록을 새로 불러왔어요.')
      onClose()
    } catch {
      // 고친 글은 창에 그대로 남아 있으니 다시 누르면 된다
      showToast('저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.')
      setBusy(false)
    }
  }

  const canSave = !!title.trim() && !!body.trim() && !busy

  // 원문 쪽: 웹에서 쓴 그대로
  const original = (
    <div className="rounded-md border bg-background p-4">
      <Markdown source={memo.content} />
      {memo.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
          {memo.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-container px-2 py-0.5 text-label-md text-on-surface-variant">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  // AI 쪽: 제목과 본문을 고칠 수 있다
  const draft = (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-label-md text-on-surface-variant">노트 제목 (파일 이름이 돼요)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </label>
      <div className="overflow-hidden rounded-md border">
        <MarkdownToolbar
          textareaRef={textareaRef}
          value={body}
          onChange={setBody}
          preview={preview}
          onTogglePreview={() => setPreview((v) => !v)}
        />
        <div className="px-3 py-2">
          {preview ? (
            <div className="min-h-[50dvh] py-1 md:min-h-96">
              <Markdown source={body} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[50dvh] w-full resize-y bg-transparent text-body-md leading-6 focus:outline-none md:min-h-96"
            />
          )}
        </div>
      </div>
    </div>
  )

  // 내용이 길어도 버튼은 창 아래에 고정된다 (Dialog footer)
  const actions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button
        variant="ghost"
        disabled={busy}
        onClick={() =>
          run(() => memoActions.saveOriginal(memo.id), `메모 ${memo.id}번을 원문 그대로 저장해요`, '고친 AI 정리를 버리고 원문 그대로 저장할까요?')
        }
      >
        <Save size={16} strokeWidth={1.75} />
        원문 그대로 저장
      </Button>
      <Button
        disabled={busy}
        onClick={() => run(() => memoActions.refineAgain(memo.id), `메모 ${memo.id}번을 다시 정제해요`, '고친 내용을 버리고 다시 정제할까요?')}
        className="sm:ml-auto"
      >
        <RotateCcw size={16} strokeWidth={1.75} />
        다시 정제
      </Button>
      <Button
        variant="primary"
        disabled={!canSave}
        onClick={() => run(() => memoActions.saveDraft(memo.id, title, body), `메모 ${memo.id}번을 저장했어요. Obsidian이 열려 있을 때 노트가 돼요`)}
      >
        <Sparkles size={16} strokeWidth={1.75} />
        이대로 저장
      </Button>
    </div>
  )

  return (
    <Dialog open onClose={close} size="lg" title={`메모 ${memo.id}번 검토`} footer={actions}>
      <p className="text-body-sm text-on-surface-variant">
        AI가 정리한 노트예요. 원문과 비교해 고친 뒤 저장하면 Obsidian이 열려 있을 때 <b>{memo.targetFolder}</b> 폴더에 노트가 돼요.
      </p>

      {/* 폰: 탭으로 하나씩 */}
      <div className="mt-4 md:hidden">
        <div role="tablist" className="mb-3 grid grid-cols-2 rounded-md bg-surface-container p-1">
          {(['원문', 'AI'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`h-9 rounded text-label-md transition-colors ${
                tab === t ? 'bg-surface-container-lowest text-on-surface shadow-card' : 'text-on-surface-variant'
              }`}
            >
              {t === '원문' ? '원문' : `AI 정리${edited ? ' · 고침' : ''}`}
            </button>
          ))}
        </div>
        {tab === '원문' ? original : draft}
      </div>

      {/* 넓은 화면: 나란히 */}
      <div className="mt-4 hidden gap-4 md:grid md:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-2 text-label-md text-on-surface-variant">원문</h3>
          {original}
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-label-md text-on-surface-variant">AI 정리{edited ? ' · 고침' : ''}</h3>
          {draft}
        </div>
      </div>
    </Dialog>
  )
}
