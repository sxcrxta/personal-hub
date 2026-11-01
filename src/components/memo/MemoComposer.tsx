// Obsidian 메모 쓰기 — 저장할 폴더, 본문(마크다운), 해시태그, 저장 방식 두 가지. 두 번 눌러도 한 건만 저장된다
import { FolderOpen, Save, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { memoActions, memoDraftStore } from '../../hooks/useMemos.ts'
import { useStore } from '../../hooks/useStore.ts'
import type { MemoSaveMode } from '../../types/data.ts'
import { settingsStore } from '../../lib/profile.ts'
import { showToast } from '../../lib/toast.ts'
import Button from '../common/Button.tsx'
import Markdown from '../common/Markdown.tsx'
import MarkdownToolbar from './MarkdownToolbar.tsx'
import TagInput from './TagInput.tsx'

export default function MemoComposer() {
  const [settings] = useStore(settingsStore)
  const [draft, setDraft] = useStore(memoDraftStore)
  const [folder, setFolder] = useState<string | null>(null) // null이면 설정의 기본 폴더
  const [editingFolder, setEditingFolder] = useState(false)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false) // 화면이 다시 그려지기 전에 두 번째 클릭이 와도 막는다
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const target = folder ?? settings.vaultFolder

  async function save(mode: MemoSaveMode) {
    if (savingRef.current || !draft.content.trim()) return
    savingRef.current = true
    setSaving(true)
    try {
      const id = await memoActions.save(draft.content.trim(), draft.tags, mode, target)
      setDraft({ content: '', tags: [] })
      setPreview(false)
      showToast(mode === '원문' ? `메모 ${id}번을 저장했어요. Obsidian이 열려 있을 때 노트가 돼요` : `메모 ${id}번을 AI 정제 대기에 올렸어요. Obsidian이 열려 있을 때 노트가 돼요`)
    } catch {
      // 쓰던 글은 지우지 않고 남겨 둔다 (architecture.md 위험 3)
      showToast('저장하지 못했어요. 쓰던 글은 남아 있으니 인터넷 연결을 확인하고 다시 눌러 주세요.')
    }
    // 저장이 끝난 뒤 잠깐 동안은 다시 누르지 못하게
    setTimeout(() => {
      savingRef.current = false
      setSaving(false)
    }, 800)
  }

  const canSave = !!draft.content.trim() && !saving

  return (
    <section className="overflow-hidden rounded-lg border bg-surface-container-lowest shadow-card">
      {/* 저장 대상 폴더 */}
      <div className="flex flex-wrap items-center gap-2 bg-surface-container-low px-4 py-3">
        <FolderOpen size={16} strokeWidth={1.75} className="text-icon" />
        <span className="text-body-sm text-on-surface-variant">저장 대상</span>
        {editingFolder ? (
          <input
            autoFocus
            defaultValue={target}
            onBlur={(e) => {
              setFolder(e.target.value.trim() || null)
              setEditingFolder(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="h-7 rounded border border-field-border bg-surface-container-lowest px-2 text-body-sm focus:outline-none"
          />
        ) : (
          <span className="rounded border bg-surface-container-lowest px-2 py-0.5 text-body-sm">볼트 / {target}</span>
        )}
        <button
          type="button"
          onClick={() => setEditingFolder(true)}
          className="ml-auto rounded px-2 py-1 text-label-md text-on-surface-variant hover:bg-hover"
        >
          이번 메모만 폴더 바꾸기
        </button>
      </div>

      <MarkdownToolbar
        textareaRef={textareaRef}
        value={draft.content}
        onChange={(content) => setDraft({ ...draft, content })}
        preview={preview}
        onTogglePreview={() => setPreview((v) => !v)}
      />

      <div className="px-4 py-3">
        {preview ? (
          <div className="min-h-64 py-1">
            {draft.content.trim() ? <Markdown source={draft.content} /> : <p className="text-placeholder">미리 볼 내용이 없어요.</p>}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="떠오른 생각을 적어 보세요. 마크다운으로 저장돼요."
            className="min-h-64 w-full resize-y bg-transparent text-body-lg placeholder:text-placeholder focus:outline-none"
          />
        )}
        <div className="mt-2 border-t pt-3">
          <TagInput tags={draft.tags} onChange={(tags) => setDraft({ ...draft, tags })} />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t bg-surface-container-low px-4 py-3 md:flex-row md:items-center">
        <span className="text-body-sm text-on-surface-variant tabular-nums">
          {draft.content.length}자 · 쓰는 중인 글은 이 브라우저에 임시로 남아요
        </span>
        <div className="flex flex-col gap-2 sm:flex-row md:ml-auto">
          <Button onClick={() => save('원문')} disabled={!canSave} className="flex-1 md:flex-none">
            <Save size={16} strokeWidth={1.75} />
            Obsidian에 그대로 저장
          </Button>
          <Button variant="primary" onClick={() => save('정제')} disabled={!canSave} className="flex-1 md:flex-none">
            <Sparkles size={16} strokeWidth={1.75} />
            AI로 정제하여 저장
          </Button>
        </div>
      </div>
    </section>
  )
}
