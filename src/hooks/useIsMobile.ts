// 지금 화면이 폰 크기(768px 미만)인지 — 데스크톱·모바일 부품을 고를 때 쓴다
import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 767px)'

function subscribe(listener: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches)
}
