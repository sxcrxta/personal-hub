// 메모 잠그기 규칙 — 그대로 저장과 AI 정제가 함께 쓴다. 두 번 처리되지 않게 '처리중'으로 바꾸고, 멈춘 작업을 다시 집어 간다
// 단계별 설명은 docs/architecture.md 7절 결정 B에 있다
import type { SupabaseClient } from '@supabase/supabase-js'

/** 처리 중인 채 이 시간이 지나면 버려진 작업으로 보고 다시 집어 간다 (결정 B) */
const STALE_MS = 10 * 60 * 1000
/** 다시 집어 가는 횟수 한도. 넘으면 실패로 두고 더 시도하지 않는다 */
const MAX_RETRY = 3

export type ClaimableMemo = {
  id: number
  status: string
  claimed_at: string | null
  retry_count: number
}

export type ClaimResult = '잠금' | '건너뜀' | '포기'

/** 기다리는 상태이거나, '처리중'인데 10분 넘게 멈춰 있는 메모를 고르는 조건 */
export function pendingFilter(waitingStatus: string): string {
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString()
  return `status.eq.${waitingStatus},and(status.eq.처리중,claimed_at.lt."${staleBefore}")`
}

export async function claimMemo(supabase: SupabaseClient, memo: ClaimableMemo, deviceName: string): Promise<ClaimResult> {
  const stale = memo.status === '처리중'
  if (stale && memo.retry_count >= MAX_RETRY) {
    await supabase
      .from('memos')
      .update({ status: '실패', error_message: `처리 중에 멈춘 일이 ${MAX_RETRY}번 넘게 생겨서 더 시도하지 않았어요.` })
      .eq('id', memo.id)
      .eq('status', '처리중')
    return '포기'
  }

  // 읽었을 때와 상태가 그대로일 때만 바뀐다. 그 사이 다른 기기가 가져갔으면 0줄이 바뀌고 건너뛴다
  let claim = supabase
    .from('memos')
    .update({
      status: '처리중',
      claimed_at: new Date().toISOString(),
      claimed_by: deviceName,
      retry_count: stale ? memo.retry_count + 1 : memo.retry_count,
    })
    .eq('id', memo.id)
    .eq('status', memo.status)
  if (stale && memo.claimed_at) claim = claim.eq('claimed_at', memo.claimed_at)
  const { data, error } = await claim.select('id')
  if (error) throw error
  return data?.length ? '잠금' : '건너뜀'
}
