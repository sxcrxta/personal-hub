// Supabase 연결 — 웹·플러그인과 똑같이 공개 키 + 내 로그인으로 접속한다. service_role 키는 쓰지 않는다
// 로그인 토큰은 ~/.personal-hub-worker/session.json에 남아서, 워커를 다시 켜도 로그인이 유지된다
import { createClient } from '@supabase/supabase-js'
import { loadSession, loadSupabaseEnv, saveSession } from './config.ts'

const { url, key } = loadSupabaseEnv()
const session = loadSession()

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: {
      getItem: (k) => session[k] ?? null,
      setItem: (k, v) => {
        session[k] = v
        saveSession(session)
      },
      removeItem: (k) => {
        delete session[k]
        saveSession(session)
      },
    },
  },
})
