// 틀(AppLayout)이 화면들에게 넘겨주는 기능 — 지금은 설정 창 열기 하나
import { useOutletContext } from 'react-router'

export type LayoutContext = {
  openSettings: () => void
}

export function useLayout(): LayoutContext {
  return useOutletContext<LayoutContext>()
}
