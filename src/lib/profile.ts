// 계정 설정 저장소 — Supabase profiles 표의 내 줄(계정당 한 줄)을 읽어 두고, 고치면 잠시 뒤 DB에 적는다
// 한 줄을 화면별로 나눠 쓴다: 설정 창(볼트 폴더·파일 이름), 할 일 정렬, 시작 안내를 닫았는지
import type { Settings } from '../types/data.ts'
import { authStore } from './auth.ts'
import { createMemoryStore, type Store } from './storage.ts'
import { supabase } from './supabase.ts'
import { showToast } from './toast.ts'

/** 할 일 정렬 방식: 마감 임박순 / 최근 추가순 / 이름순 */
export type TodoSort = 'due' | 'recent' | 'name'

type Profile = Settings & { todoSort: TodoSort; onboardingDismissed: boolean }

const DEFAULTS: Profile = {
  vaultFolder: '0. Slip-box',
  fileNameFormat: 'yyyy-MM-dd 메모 {번호}',
  todoSort: 'due',
  onboardingDismissed: false,
}

/** 입력칸에서 글자를 칠 때마다 DB에 쓰지 않도록, 마지막으로 고친 뒤 이만큼 기다렸다가 쓴다 */
const SAVE_DELAY_MS = 600

const memory = createMemoryStore<Profile>(DEFAULTS)
let loadedFor: string | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined

async function load(userId: string) {
  loadedFor = userId
  const { data, error } = await supabase
    .from('profiles')
    .select('vault_folder, file_name_format, todo_sort, onboarding_dismissed')
    .eq('user_id', userId)
    .single()
  if (loadedFor !== userId) return // 그사이 다른 계정으로 바뀌었으면 버린다
  if (error) {
    showToast('설정을 불러오지 못했어요. 새로고침해 주세요.')
    return
  }
  memory.set({
    vaultFolder: data.vault_folder,
    fileNameFormat: data.file_name_format,
    todoSort: data.todo_sort,
    onboardingDismissed: data.onboarding_dismissed,
  })
}

async function save() {
  const userId = authStore.get().session?.user.id
  if (!userId) return
  const p = memory.get()
  const { error } = await supabase
    .from('profiles')
    .update({
      vault_folder: p.vaultFolder,
      file_name_format: p.fileNameFormat,
      todo_sort: p.todoSort,
      onboarding_dismissed: p.onboardingDismissed,
    })
    .eq('user_id', userId)
  if (error) showToast('설정을 저장하지 못했어요. 인터넷 연결을 확인해 주세요.')
}

// 로그인하면 그 계정 설정을 불러오고, 로그아웃하면 기본값으로 돌린다
function syncWithAuth() {
  const userId = authStore.get().session?.user.id ?? null
  if (userId === loadedFor) return
  clearTimeout(saveTimer)
  if (userId) {
    void load(userId)
  } else {
    loadedFor = null
    memory.set(DEFAULTS)
  }
}
authStore.subscribe(syncWithAuth)
syncWithAuth()

/** 설정 줄의 일부만 보여 주는 저장소. 같은 줄이면 같은 객체를 돌려줘야 화면이 쓸데없이 다시 그려지지 않는다 */
function view<T>(pick: (p: Profile) => T, merge: (p: Profile, value: T) => Profile): Store<T> {
  let lastProfile: Profile | undefined
  let lastValue: T
  const get = () => {
    const p = memory.get()
    if (p !== lastProfile) {
      lastProfile = p
      lastValue = pick(p)
    }
    return lastValue
  }
  return {
    get,
    subscribe: memory.subscribe,
    set(next) {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(get()) : next
      memory.set(merge(memory.get(), value))
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => void save(), SAVE_DELAY_MS)
    },
  }
}

export const settingsStore = view<Settings>(
  (p) => ({ vaultFolder: p.vaultFolder, fileNameFormat: p.fileNameFormat }),
  (p, s) => ({ ...p, ...s }),
)

export const todoPrefsStore = view<{ sort: TodoSort }>(
  (p) => ({ sort: p.todoSort }),
  (p, v) => ({ ...p, todoSort: v.sort }),
)

export const onboardingStore = view<{ dismissed: boolean }>(
  (p) => ({ dismissed: p.onboardingDismissed }),
  (p, v) => ({ ...p, onboardingDismissed: v.dismissed }),
)
