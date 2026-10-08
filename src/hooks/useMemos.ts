// Obsidian 메모와 단순 메모장 읽고 쓰기 — 메모는 '대기 중'으로 쌓아 두면 맥북 프로그램이 가져간다
import { useEffect, useState } from 'react'
import type { MemoSaveMode, Note } from '../types/data.ts'
import { now, toUtc } from '../lib/date.ts'
import { createStore, newId, type Store } from '../lib/storage.ts'
import { settingsStore } from '../lib/profile.ts'
import { memosStore, notesStore, workerStore } from '../lib/stores.ts'
import { withUndo } from './undo.ts'
import { useStore } from './useStore.ts'

/** 워커 신호가 이 시간 안에 왔으면 켜져 있다고 본다 */
const WORKER_ALIVE_MS = 2 * 60 * 1000

/** 저장 전에 쓰던 글 — 저장에 실패하거나 창을 닫아도 남아 있게 */
export const memoDraftStore = createStore<{ content: string; tags: string[] }>('memo-draft', () => ({ content: '', tags: [] }))

/** 워커가 켜져 있는지. 30초마다 다시 확인한다 */
export function useWorkerOnline(): boolean {
  const [worker] = useStore(workerStore)
  const [checkedAt, setCheckedAt] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setCheckedAt(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])
  return !!worker.lastSeenAt && checkedAt - new Date(worker.lastSeenAt).getTime() < WORKER_ALIVE_MS
}

/** 볼트 폴더 이름 정리: 앞뒤 공백과 맨 앞 '/' 제거 (architecture.md 결정 A) */
export function cleanFolder(folder: string): string {
  return folder.trim().replace(/^\/+/, '')
}

export const memoActions = {
  save(content: string, tags: string[], saveMode: MemoSaveMode, targetFolder: string): number {
    const id = Math.max(0, ...memosStore.get().map((m) => m.id)) + 1
    memosStore.set((prev) => [
      ...prev,
      {
        id,
        content,
        tags,
        saveMode,
        status: saveMode === '원문' ? '대기중' : '정제대기',
        targetFolder: cleanFolder(targetFolder) || settingsStore.get().vaultFolder,
        createdAt: toUtc(now()),
      },
    ])
    return id
  },
  /** 실패한 메모를 다시 대기 줄에 올린다 */
  retry(id: number) {
    memosStore.set((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.saveMode === '원문' ? '대기중' : '정제대기', errorMessage: undefined } : m,
      ),
    )
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
