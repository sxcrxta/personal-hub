// Supabase 연결 — 앱 전체가 이 클라이언트 하나만 쓴다
// 공개 키(publishable)로 접속하고, 누가 무엇을 볼 수 있는지는 DB의 RLS가 정한다
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error('Supabase 연결 정보가 없습니다. .env.example을 보고 .env.local을 만들어 주세요.')
}

export const supabase = createClient(url, key)
