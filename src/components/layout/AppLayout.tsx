// 로그인 뒤 모든 화면의 틀 — 데스크톱은 사이드바+상단바, 폰은 상단바+하단 탭
import { useState } from 'react'
import { Outlet } from 'react-router'
import Toast from '../common/Toast.tsx'
import SettingsDialog from './SettingsDialog.tsx'
import SidebarDesktop from './SidebarDesktop.tsx'
import TabBarMobile from './TabBarMobile.tsx'
import TopBarDesktop from './TopBarDesktop.tsx'
import TopBarMobile from './TopBarMobile.tsx'
import type { LayoutContext } from './layoutContext.ts'

export default function AppLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const openSettings = () => setSettingsOpen(true)

  return (
    <div className="min-h-dvh md:flex">
      <SidebarDesktop onOpenSettings={openSettings} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBarDesktop />
        <TopBarMobile onOpenSettings={openSettings} />

        {/* 폰에서는 하단 탭에 가리지 않게 아래 여백을 둔다 */}
        <main className="mx-auto w-full max-w-page flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10">
          <Outlet context={{ openSettings } satisfies LayoutContext} />
        </main>
      </div>

      <TabBarMobile />
      <Toast />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
