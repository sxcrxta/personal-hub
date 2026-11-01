// 살아 있다는 신호 — 기기 이름으로 worker_devices에 한 줄을 두고 last_seen_at을 지금으로 고친다
// 웹은 이 시각이 2분 안이면 '켜짐'으로 표시한다
import type { SupabaseClient } from '@supabase/supabase-js'

/** 처음이면 기기를 등록하고, 이미 있으면 시각만 새로 적는다 */
export async function sendHeartbeat(supabase: SupabaseClient, deviceName: string): Promise<void> {
  const { error } = await supabase
    .from('worker_devices')
    .upsert({ name: deviceName, last_seen_at: new Date().toISOString() }, { onConflict: 'user_id,name' })
  if (error) throw error
}
