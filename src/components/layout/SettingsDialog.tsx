// 설정 창 — 사이드바(폰은 상단바)의 설정 버튼으로 연다. 계정, 볼트 폴더와 파일 이름 형식, Obsidian 연결 기기와 설치 파일, 알림 켜기, 테마
import { Download, LogOut } from 'lucide-react'
import { useStore } from '../../hooks/useStore.ts'
import { cleanFolder, isWorkerAlive, useWorkers } from '../../hooks/useMemos.ts'
import { authStore } from '../../lib/auth.ts'
import { INSTALLER_URL } from '../../lib/installer.ts'
import { daysFromToday, formatMonthDay, formatTime, fromUtc } from '../../lib/date.ts'
import { reviewPrefsStore, settingsStore } from '../../lib/profile.ts'
import { supabase } from '../../lib/supabase.ts'
import Button from '../common/Button.tsx'
import Checkbox from '../common/Checkbox.tsx'
import Dialog from '../common/Dialog.tsx'
import { Field, TextInput } from '../common/Field.tsx'
import NotificationSettings from './NotificationSettings.tsx'
import ThemeSettings from './ThemeSettings.tsx'

type Props = {
  open: boolean
  onClose: () => void
}

function lastSeenText(iso: string): string {
  const dt = fromUtc(iso)
  return daysFromToday(dt) === 0 ? `오늘 ${formatTime(dt)}` : `${formatMonthDay(dt)} ${formatTime(dt)}`
}

export default function SettingsDialog({ open, onClose }: Props) {
  const [settings, setSettings] = useStore(settingsStore)
  const [reviewPrefs, setReviewPrefs] = useStore(reviewPrefsStore)
  const [{ session }] = useStore(authStore)
  const { devices, checkedAt } = useWorkers()

  async function logout() {
    onClose()
    // 세션이 사라지면 RequireAuth가 /login으로 보낸다
    await supabase.auth.signOut()
  }

  return (
    <Dialog open={open} onClose={onClose} title="설정">
      <div className="space-y-5">
        <section className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-headline-sm">계정</h3>
            <p className="truncate text-body-sm text-on-surface-variant">{session?.user.email}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={logout}>
            <LogOut size={16} strokeWidth={1.75} />
            로그아웃
          </Button>
        </section>
        <section className="space-y-3">
          <h3 className="text-headline-sm">Obsidian 볼트</h3>
          <Field label="메모를 저장할 볼트 안쪽 폴더">
            <TextInput
              value={settings.vaultFolder}
              placeholder="예: 0. Slip-box"
              onChange={(e) => setSettings({ ...settings, vaultFolder: e.target.value })}
              onBlur={(e) => setSettings({ ...settings, vaultFolder: cleanFolder(e.target.value) })}
            />
          </Field>
          <p className="text-body-sm text-on-surface-variant">
            웹은 볼트 안을 볼 수 없어서 폴더 이름을 직접 적어요. 컴퓨터 전체 경로(/Users/…)는 적지 않아요.
          </p>
          <Field label="파일 이름 형식">
            <TextInput
              value={settings.fileNameFormat}
              onChange={(e) => setSettings({ ...settings, fileNameFormat: e.target.value })}
            />
          </Field>
          <p className="text-body-sm text-on-surface-variant">{'{번호}'} 자리에 메모 번호가 들어가서 같은 노트가 두 번 생기지 않아요.</p>
          <div className="flex items-start gap-3 rounded border bg-surface-container-low p-3">
            <div className="pt-0.5">
              <Checkbox
                checked={reviewPrefs.reviewBeforeSave}
                onChange={() => setReviewPrefs({ reviewBeforeSave: !reviewPrefs.reviewBeforeSave })}
                label="AI 정제 결과를 저장 전에 검토하기"
              />
            </div>
            <button
              type="button"
              className="min-w-0 text-left"
              onClick={() => setReviewPrefs({ reviewBeforeSave: !reviewPrefs.reviewBeforeSave })}
            >
              <span className="block text-body-md">AI 정제 결과를 저장 전에 검토하기</span>
              <span className="block text-body-sm text-on-surface-variant">
                켜면 AI가 정리한 노트가 바로 볼트로 가지 않고, 메모 화면에서 원문과 비교해 고친 뒤 저장해요. 폰에서도 돼요.
              </span>
            </button>
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-headline-sm">Obsidian 연결</h3>
          {devices.length ? (
            <ul className="divide-y rounded border">
              {devices.map((d) => {
                const alive = isWorkerAlive(d, checkedAt)
                return (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-full ${alive ? 'bg-science' : 'bg-outline'}`} />
                      <span className="truncate text-body-md">{d.name}</span>
                    </span>
                    <span className={`shrink-0 text-body-sm ${alive ? 'text-science' : 'text-on-surface-variant'}`}>
                      {alive ? '켜짐' : `꺼짐 · 마지막 신호 ${lastSeenText(d.lastSeenAt)}`}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              아직 연결된 기기가 없어요. 설치 파일로 플러그인을 넣고 로그인하면 여기에 생겨요.
            </p>
          )}
          <a
            href={INSTALLER_URL}
            download
            className="inline-flex items-center gap-2 text-label-md text-primary-container hover:underline"
          >
            <Download size={16} strokeWidth={1.75} />
            Mac 설치 파일 내려받기
          </a>
        </section>
        <NotificationSettings />
        <ThemeSettings />
      </div>
    </Dialog>
  )
}
