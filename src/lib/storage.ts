// localStorage 저장소 — 키 하나에 데이터 하나를 두고, 바뀌면 그 데이터를 쓰는 화면에 알린다
// 3회차에 Supabase로 바꿀 때 이 파일과 hooks만 고치면 되도록 화면은 여기를 직접 부르지 않는다

const PREFIX = 'personal-hub:'

export type Store<T> = {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

export function createStore<T>(key: string, initial: () => T): Store<T> {
  const storageKey = PREFIX + key
  const listeners = new Set<() => void>()
  let cache: T | undefined

  function read(): T {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      // 저장된 값이 깨졌거나 localStorage를 못 쓰면 처음 값으로 시작한다
    }
    const value = initial()
    write(value)
    return value
  }

  function write(value: T) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // 저장 공간이 없거나 막혀 있어도 화면은 계속 동작하게 둔다
    }
  }

  function get(): T {
    if (cache === undefined) cache = read()
    return cache
  }

  return {
    get,
    set(next) {
      const prev = get()
      cache = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
      write(cache)
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/** 새 항목 id */
export function newId(): string {
  return crypto.randomUUID()
}

/** 저장하지 않고 화면이 열려 있는 동안만 쓰는 값 (알림 막대 등) */
export function createMemoryStore<T>(initial: T): Store<T> {
  const listeners = new Set<() => void>()
  let value = initial
  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
