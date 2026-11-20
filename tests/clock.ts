// 테스트용 시계 — '지금'을 2026년 11월 18일(수) 오전 10시(한국 시간)로 고정해서, 언제 돌려도 결과가 같게 한다
import { DateTime, Settings } from 'luxon'

export const NOW = DateTime.fromISO('2026-11-18T10:00', { zone: 'Asia/Seoul' })
Settings.now = () => NOW.toMillis()

export const TODAY = '2026-11-18'
export const YESTERDAY = '2026-11-17'
export const TOMORROW = '2026-11-19'
