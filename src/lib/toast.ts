// 화면 아래에 잠깐 뜨는 알림 막대 — "삭제했어요 [되돌리기]"처럼 버튼 하나를 붙일 수 있다
import { createMemoryStore } from './storage.ts'

export type Toast = {
  id: number
  message: string
  actionLabel?: string
  action?: () => void
}

export const toastStore = createMemoryStore<Toast | null>(null)

let lastId = 0
let timer: ReturnType<typeof setTimeout> | undefined

export function showToast(message: string, actionLabel?: string, action?: () => void) {
  lastId += 1
  toastStore.set({ id: lastId, message, actionLabel, action })
  clearTimeout(timer)
  timer = setTimeout(() => toastStore.set(null), 5000)
}

export function hideToast() {
  clearTimeout(timer)
  toastStore.set(null)
}

/** 지운 뒤 되돌리기 버튼을 띄운다 */
export function showUndo(message: string, undo: () => void) {
  showToast(message, '되돌리기', undo)
}
