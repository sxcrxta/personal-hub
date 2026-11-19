// Obsidian 메모와 단순 메모장 읽고 쓰기 — 메모는 '대기 중'으로 쌓아 두면 플러그인이 가져간다
import { useEffect, useState } from 'react'
import type { MemoSaveMode, Note, WorkerDevice } from '../types/data.ts'
import { now, toUtc } from '../lib/date.ts'
import { createStore, newId, type Store } from '../lib/storage.ts'
import { reviewPrefsStore, settingsStore } from '../lib/profile.ts'
import { memoFromRow, memosStore, notesStore, refreshMemos, refreshWorkers, workersStore } from '../lib/stores.ts'
import { supabase } from '../lib/supabase.ts'
import { withUndo } from './undo.ts'
import { useStore } from './useStore.ts'

/** 플러그인 신호가 이 시간 안에 왔으면 켜져 있다고 본다 (플러그인은 1분마다 보낸다) */
const WORKER_ALIVE_MS = 2 * 60 * 1000
const MEMO_REFRESH_MS = 15_000

/** 저장 전에 쓰던 글 — 저장에 실패하거나 창을 닫아도 남아 있게 */
export const memoDraftStore = createStore<{ content: string; tags: string[] }>('memo-draft', () => ({ content: '', tags: [] }))

export function isWorkerAlive(device: WorkerDevice, at: number): boolean {
  return at - new Date(device.lastSeenAt).getTime() < WORKER_ALIVE_MS
}

/** 연결 기기 목록과 확인한 시각. 30초마다 DB에서 신호를 다시 읽는다 */
export function useWorkers(): { devices: WorkerDevice[]; checkedAt: number } {
  const [devices] = useStore(workersStore)
  const [checkedAt, setCheckedAt] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => {
      // 한 번 못 읽어도(인터넷 끊김 등) 지난 값으로 계속 판단한다
      refreshWorkers().catch(() => {})
      setCheckedAt(Date.now())
    }, 30_000)
    return () => clearInterval(timer)
  }, [])
  return { devices, checkedAt }
}

/** 플러그인이 하나라도 켜져 있는지 — 메모 화면의 켜짐/꺼짐 표시에 쓴다 */
export function useWorkerOnline(): boolean {
  const { devices, checkedAt } = useWorkers()
  return devices.some((d) => isWorkerAlive(d, checkedAt))
}

/** 메모 화면을 열 때, 탭으로 돌아올 때, 처리를 기다리는 메모가 있는 동안 15초마다 상태를 다시 읽는다 */
export function useMemoRefresh() {
  useEffect(() => {
    // 한 번 못 읽어도(인터넷 끊김 등) 지난 값을 그대로 보여 주고 다음에 다시 읽는다
    const refresh = () => void refreshMemos().catch(() => {})
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    refresh()
    document.addEventListener('visibilitychange', onVisible)
    const timer = setInterval(() => {
      // 검토 필요는 사람을 기다리는 것이라 다시 읽을 필요가 없다
      const waiting = memosStore.get().some((m) => !['완료', '실패', '검토대기'].includes(m.status))
      if (waiting && document.visibilityState === 'visible') refresh()
    }, MEMO_REFRESH_MS)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}

/** 볼트 폴더 이름 정리: 앞뒤 공백과 맨 앞 '/' 제거 (architecture.md 결정 A) */
export function cleanFolder(folder: string): string {
  return folder.trim().replace(/^\/+/, '')
}

type ReviewPatch = {
  status: '저장대기' | '정제대기' | '대기중'
  save_mode?: '원문'
  draft_title: string | null
  draft_body: string | null
  error_message: null
}

export const memoActions = {
  /** DB에 바로 넣고 DB가 정한 메모 번호를 돌려준다. 실패하면 오류를 던진다(쓰던 글은 화면에 남긴다) */
  async save(content: string, tags: string[], saveMode: MemoSaveMode, targetFolder: string): Promise<number> {
    const { data, error } = await supabase
      .from('memos')
      .insert({
        content,
        tags,
        save_mode: saveMode,
        status: saveMode === '원문' ? '대기중' : '정제대기',
        review: saveMode === '정제' && reviewPrefsStore.get().reviewBeforeSave,
        target_folder: cleanFolder(targetFolder) || settingsStore.get().vaultFolder,
      })
      .select()
      .single()
    if (error) throw error
    const memo = memoFromRow(data)
    memosStore.applyRemote((prev) => [...prev, memo])
    return memo.id
  },
  /** 실패한 메모를 다시 대기 줄에 올린다. 검토를 마친 초안이 있으면 다시 정제하지 않고 그 초안으로 저장한다 */
  retry(id: number) {
    memosStore.set((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.saveMode === '원문' ? '대기중' : m.draftBody ? '저장대기' : '정제대기', errorMessage: undefined }
          : m,
      ),
    )
  },
  /**
   * 검토 결과를 DB에 바로 적는다. 플러그인이 이미 가져간 뒤에 고치면 노트와 어긋나므로 '검토대기'일 때만 바뀐다
   * 바뀐 줄이 없으면 false — 다른 기기에서 먼저 처리한 것이다
   */
  async review(id: number, patch: ReviewPatch): Promise<boolean> {
    const { data, error } = await supabase.from('memos').update(patch).eq('id', id).eq('status', '검토대기').select()
    if (error) throw error
    if (data.length) {
      const updated = memoFromRow(data[0])
      memosStore.applyRemote((prev) => prev.map((m) => (m.id === id ? updated : m)))
      return true
    }
    await refreshMemos().catch(() => {})
    return false
  },
  /** 고친 제목·본문으로 저장 → 플러그인이 이 글 그대로 노트를 만든다 */
  saveDraft(id: number, title: string, body: string) {
    return this.review(id, { status: '저장대기', draft_title: title.trim(), draft_body: body, error_message: null })
  },
  /** 초안을 버리고 처음부터 다시 정제 */
  refineAgain(id: number) {
    return this.review(id, { status: '정제대기', draft_title: null, draft_body: null, error_message: null })
  },
  /** AI 결과를 버리고 원문 그대로 저장 (경로 A) */
  saveOriginal(id: number) {
    return this.review(id, { status: '대기중', save_mode: '원문', draft_title: null, draft_body: null, error_message: null })
  },
  /** 웹에서만 지운다. 이미 만들어진 볼트 노트는 그대로 남는다 */
  remove(id: number) {
    withUndo('메모를 지웠어요 (볼트 노트는 그대로예요)', [memosStore as Store<unknown>], () => {
      memosStore.set((prev) => prev.filter((m) => m.id !== id))
    })
  },
}

export const noteActions = {
  add(): string {
    const id = newId()
    notesStore.set((prev) => [{ id, title: '', body: '', updatedAt: toUtc(now()) }, ...prev])
    return id
  },
  update(id: string, patch: Partial<Pick<Note, 'title' | 'body'>>) {
    notesStore.set((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: toUtc(now()) } : n)))
  },
  remove(id: string) {
    withUndo('메모를 지웠어요', [notesStore as Store<unknown>], () => {
      notesStore.set((prev) => prev.filter((n) => n.id !== id))
    })
  },
}

/** 본문에서 #태그 뽑기 */
export function tagsOf(text: string): string[] {
  return [...new Set([...text.matchAll(/#([^\s#]+)/g)].map((m) => m[1]))]
}
