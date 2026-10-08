// Supabase와 맞춰 두는 저장소 — 화면은 예전 localStorage 저장소처럼 get/set/subscribe로 쓰고,
// 바뀐 값은 "마지막으로 DB와 맞춘 값"과 비교해서 달라진 줄만 DB에 보낸다
//
// 흐름: set → 화면에 바로 반영 → 잠시 뒤 한꺼번에 DB에 적기
// - 글자를 칠 때마다 요청하지 않도록 WRITE_DELAY_MS만큼 모아서 보낸다
// - 저장소 여러 개가 바뀌면 바뀐 순서대로 하나씩 보낸다 (할 일을 만든 뒤에 그 할 일과 연결된 일정을 적어야 하므로)
// - 실패하면 알림을 띄우고 DB 값을 다시 불러와 화면을 DB와 맞춘다
import { authStore } from './auth.ts'
import { createMemoryStore, type Store } from './storage.ts'
import { supabase } from './supabase.ts'
import { showToast } from './toast.ts'

export type Row = Record<string, unknown>

/** 저장소 하나가 DB의 어떤 표들에 어떻게 나뉘어 들어가는지 */
export type TableSpec = {
  name: string
  /** 줄을 구별하는 열. 기본 ['id'] */
  key?: string[]
  /** upsert 때 겹침을 판단할 고유 제약의 열. 기본 'id' */
  onConflict?: string
  /** true면 지운 줄을 DB에서 지우지 않는다 (지난 기록을 남기는 표) */
  keepDeleted?: boolean
}

export type SyncedStore<T> = Store<T> & {
  /** DB에서 이미 바뀐 값을 화면에만 반영한다 (다시 DB에 보내지 않는다) */
  applyRemote: (next: (prev: T) => T) => void
}

type SyncConfig<T> = {
  empty: () => T
  load: () => Promise<T>
  tables?: TableSpec[] // 비어 있으면 읽기만 하는 저장소
  /** 값을 표별 줄 목록으로 펼친다. 표 순서는 부모 → 자식 */
  toRows?: (value: T) => Record<string, Row[]>
}

const WRITE_DELAY_MS = 400

type Entry = {
  name: string
  reset: () => void
  load: () => Promise<void>
  flush: () => Promise<void>
}

const entries: Entry[] = []
const dirty: Entry[] = [] // 바뀐 순서대로
let writeTimer: ReturnType<typeof setTimeout> | undefined
let writing: Promise<void> = Promise.resolve()

/** 로그인한 계정의 데이터를 다 불러왔는지 */
export const dataStatusStore = createMemoryStore<{ ready: boolean }>({ ready: false })

function keyOf(row: Row, cols: string[]): string {
  return cols.map((c) => String(row[c])).join('|')
}

/** 이전 줄 목록과 새 줄 목록을 비교해서 달라진 것만 DB에 보낸다 */
async function writeDiff(specs: TableSpec[], before: Record<string, Row[]>, after: Record<string, Row[]>) {
  // 넣기·고치기는 부모 표부터 (자식이 부모를 가리키므로)
  for (const spec of specs) {
    const cols = spec.key ?? ['id']
    const old = new Map((before[spec.name] ?? []).map((r) => [keyOf(r, cols), JSON.stringify(r)]))
    const changed = (after[spec.name] ?? []).filter((r) => old.get(keyOf(r, cols)) !== JSON.stringify(r))
    if (!changed.length) continue
    // defaultToNull: false — 줄마다 열이 다르면 빠진 열을 null이 아니라 표의 기본값으로 채운다
    const { error } = await supabase
      .from(spec.name)
      .upsert(changed, { onConflict: spec.onConflict ?? 'id', defaultToNull: false })
    if (error) throw error
  }
  // 지우기는 자식 표부터
  for (const spec of [...specs].reverse()) {
    if (spec.keepDeleted) continue
    const cols = spec.key ?? ['id']
    const now = new Set((after[spec.name] ?? []).map((r) => keyOf(r, cols)))
    const removed = (before[spec.name] ?? []).filter((r) => !now.has(keyOf(r, cols)))
    if (!removed.length) continue
    if (cols.length === 1) {
      const { error } = await supabase.from(spec.name).delete().in(cols[0], removed.map((r) => r[cols[0]]))
      if (error) throw error
    } else {
      for (const r of removed) {
        const { error } = await supabase.from(spec.name).delete().match(Object.fromEntries(cols.map((c) => [c, r[c]])))
        if (error) throw error
      }
    }
  }
}

function scheduleWrite() {
  clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writing = writing.then(async () => {
      while (dirty.length) {
        const entry = dirty.shift()!
        await entry.flush()
      }
    })
  }, WRITE_DELAY_MS)
}

export function createSyncedStore<T>(name: string, config: SyncConfig<T>): SyncedStore<T> {
  const memory = createMemoryStore<T>(config.empty())
  let synced: T = memory.get() // 마지막으로 DB와 같다고 확인한 값

  const entry: Entry = {
    name,
    reset() {
      memory.set(config.empty())
      synced = memory.get()
    },
    async load() {
      const value = await config.load()
      memory.set(value)
      synced = value
    },
    async flush() {
      const { tables, toRows } = config
      if (!tables || !toRows) return
      const target = memory.get()
      if (target === synced) return
      try {
        await writeDiff(tables, toRows(synced), toRows(target))
        synced = target
      } catch (error) {
        console.error(`[${name}] 저장 실패`, error)
        showToast('저장하지 못했어요. 인터넷 연결을 확인해 주세요.')
        // 화면을 DB와 다시 맞춘다
        try {
          await entry.load()
        } catch {
          // 다시 불러오기도 실패하면 화면 값을 그대로 둔다
        }
      }
    },
  }
  entries.push(entry)

  return {
    get: memory.get,
    subscribe: memory.subscribe,
    set(next) {
      memory.set(next)
      if (!config.tables) return
      if (!dirty.includes(entry)) dirty.push(entry)
      scheduleWrite()
    },
    applyRemote(next) {
      memory.set(next)
      synced = next(synced)
    },
  }
}

// ───────── 로그인·로그아웃에 맞춰 불러오기 ─────────

let loadedFor: string | null = null

async function loadAll(userId: string) {
  loadedFor = userId
  dataStatusStore.set({ ready: false })
  const results = await Promise.allSettled(entries.map((e) => e.load()))
  if (loadedFor !== userId) return // 그사이 다른 계정으로 바뀌었으면 버린다
  const failed = results
    .map((r, i) => (r.status === 'rejected' ? entries[i].name : null))
    .filter(Boolean)
  if (failed.length) {
    console.error('불러오기 실패:', failed, results)
    showToast('데이터 일부를 불러오지 못했어요. 새로고침해 주세요.')
  }
  dataStatusStore.set({ ready: true })
}

/** 모든 저장소를 만든 뒤 한 번 부른다 */
export function startSync() {
  function onAuth() {
    const userId = authStore.get().session?.user.id ?? null
    if (userId === loadedFor) return
    clearTimeout(writeTimer)
    dirty.length = 0
    entries.forEach((e) => e.reset())
    if (userId) {
      void loadAll(userId)
    } else {
      loadedFor = null
      dataStatusStore.set({ ready: false })
    }
  }
  authStore.subscribe(onAuth)
  onAuth()
}

// ───────── 줄 ↔ 값 변환 도우미 ─────────

/** undefined를 null로 (DB에 '비어 있음'으로 적히게) */
export function n<T>(value: T | undefined): T | null {
  return value === undefined ? null : value
}

/** null을 undefined로 (화면 타입은 선택 값을 undefined로 쓴다) */
export function u<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

/** DB의 time 'HH:mm:ss'를 화면의 'HH:mm'으로 */
export function hhmm(value: string | null): string | undefined {
  return value === null ? undefined : value.slice(0, 5)
}

/** 내 계정의 표 전체를 만든 순서대로 읽는다 (RLS가 내 줄만 돌려준다) */
export async function selectAll(table: string, columns = '*'): Promise<Row[]> {
  const { data, error } = await supabase.from(table).select(columns).order('created_at')
  if (error) throw error
  return (data ?? []) as unknown as Row[]
}
