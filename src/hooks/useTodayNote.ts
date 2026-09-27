// 오늘 다시 볼 예전 노트 하나를 고른다 — 하루 동안 같은 노트를 보여주고, '다른 노트 보기'로 바꿀 수 있다
import { todayKey } from '../lib/date.ts'
import { todayNoteStore, vaultNotesStore } from '../lib/stores.ts'
import { useStore } from './useStore.ts'

export function useTodayNote() {
  const [notes] = useStore(vaultNotesStore)
  const [pick, setPick] = useStore(todayNoteStore)
  const today = todayKey()

  // 오늘 고른 노트가 있으면 그것, 없으면 날짜로 하나를 정한다(새로고침해도 같은 노트)
  const picked = pick?.date === today ? notes.find((n) => n.id === pick.noteId) : undefined
  const note = picked ?? (notes.length ? notes[hashOf(today) % notes.length] : undefined)

  function showAnother() {
    const others = notes.filter((n) => n.id !== note?.id)
    if (!others.length) return
    const next = others[Math.floor(Math.random() * others.length)]
    setPick({ date: today, noteId: next.id })
  }

  return { note, canShowAnother: notes.length > 1, showAnother }
}

function hashOf(text: string): number {
  let hash = 0
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return hash
}
