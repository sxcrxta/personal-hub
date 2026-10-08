// 계정 설정 저장소 — Supabase profiles 표의 내 줄을 읽어 두고, 고치면 잠시 뒤 DB에 적는다
// 화면은 예전 localStorage 저장소와 똑같이 get/set/subscribe로 쓴다
import type { Settings } from '../types/data.ts'
import { authStore } from './auth.ts'
import { createMemoryStore, type Store } from './storage.ts'
import { supabase } from './supabase.ts'
import { showToast } from './toast.ts'

const DEFAULTS: Settings = { vaultFolder: '0. Slip-box', fileNameFormat: 'yyyy-MM-dd 메모 {번호}' }

/** 입력칸에서 글자를 칠 때마다 DB에 쓰지 않도록, 마지막으로 고친 뒤 이만큼 기다렸다가 쓴다 */
const SAVE_DELAY_MS = 600

const memory = createMemoryStore<Settings>(DEFAULTS)
let loadedFor: string | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined

async function load(userId: string) {
  loadedFor = userId
  const { data, error } = await supabase
    .from('profiles')
    .select('vault_folder, file_name_format')
    .eq('user_id', userId)
    .single()
  if (loadedFor !== userId) return // 그사이 다른 계정으로 바뀌었으면 버린다
  if (error) {
    showToast('설정을 불러오지 못했어요. 새로고침해 주세요.')
    return
  }
  memory.set({ vaultFolder: data.vault_folder, fileNameFormat: data.file_name_format })
}

async function save() {
  const userId = authStore.get().session?.user.id
  if (!userId) return
  const { vaultFolder, fileNameFormat } = memory.get()
  const { error } = await supabase
    .from('profiles')
    .update({ vault_folder: vaultFolder, file_name_format: fileNameFormat })
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

export const settingsStore: Store<Settings> = {
  get: memory.get,
  subscribe: memory.subscribe,
  set(next) {
    memory.set(next)
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void save(), SAVE_DELAY_MS)
  },
}
