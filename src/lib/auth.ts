// 로그인 상태 저장소 — Supabase가 알려 주는 세션을 한곳에 두고, 바뀌면 화면에 알린다
import type { Session } from '@supabase/supabase-js'
import { createMemoryStore } from './storage.ts'
import { supabase } from './supabase.ts'

/** loading: 브라우저에 남은 세션을 아직 확인하는 중 */
export type AuthState = { loading: boolean; session: Session | null }

export const authStore = createMemoryStore<AuthState>({ loading: true, session: null })

// 처음 열 때 한 번 확인하고, 이후 로그인·로그아웃·토큰 갱신마다 다시 적는다
supabase.auth.getSession().then(({ data }) => {
  authStore.set({ loading: false, session: data.session })
})
supabase.auth.onAuthStateChange((_event, session) => {
  authStore.set({ loading: false, session })
})

/** Supabase 오류 문구를 화면에 보여줄 한국어로 바꾼다 */
export function authErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) return '이메일이나 비밀번호가 맞지 않아요.'
  if (message.includes('Email not confirmed')) return '아직 이메일 인증을 하지 않았어요. 메일함의 인증 링크를 눌러 주세요.'
  if (message.includes('User already registered')) return '이미 가입한 이메일이에요. 로그인해 주세요.'
  if (message.includes('Password should be at least')) return '비밀번호는 6자 이상이어야 해요.'
  if (message.includes('Unable to validate email address')) return '이메일 주소 형식이 맞지 않아요.'
  if (message.includes('rate limit')) return '요청이 너무 많아요. 잠시 뒤에 다시 해 주세요.'
  return message
}
