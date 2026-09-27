// 되돌리기 도우미 — 고치기 전 값을 기억해 두고, 알림 막대의 '되돌리기'를 누르면 그대로 돌려놓는다
import type { Store } from '../lib/storage.ts'
import { showUndo } from '../lib/toast.ts'

export function withUndo(message: string, stores: Store<unknown>[], change: () => void) {
  const snapshots = stores.map((store) => [store, store.get()] as const)
  change()
  showUndo(message, () => snapshots.forEach(([store, value]) => store.set(value)))
}
