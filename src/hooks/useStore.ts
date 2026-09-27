// 저장소 값을 화면에서 읽고 쓰는 훅 — 값이 바뀌면 그 값을 쓰는 모든 화면이 다시 그려진다
import { useSyncExternalStore } from 'react'
import type { Store } from '../lib/storage.ts'

export function useStore<T>(store: Store<T>): [T, Store<T>['set']] {
  const value = useSyncExternalStore(store.subscribe, store.get)
  return [value, store.set]
}
