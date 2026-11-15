// 설정 창의 알림 칸 — 이 기기에서 푸시 알림 켜기·끄기와 테스트 알림 보내기
import { Bell, BellOff, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushState, sendTestPush, type PushState } from '../../lib/push.ts'
import Button from '../common/Button.tsx'

const STATE_TEXT: Record<PushState, string> = {
  unsupported: '이 브라우저에서는 알림을 받을 수 없어요.',
  'needs-install': '아이폰은 Safari 공유 버튼 → "홈 화면에 추가"로 앱을 설치한 뒤, 그 앱에서 알림을 켤 수 있어요.',
  denied: '알림이 꺼져 있어요. 기기 설정 → 알림에서 Personal Hub(또는 브라우저)를 허용해 주세요.',
  off: '이 기기는 알림을 받지 않아요.',
  on: '이 기기로 알림이 와요. 습관에 알림 시각을 정하면 그 시각에 알려 드려요.',
}

export default function NotificationSettings() {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    pushState().then(setState, () => setState('unsupported'))
  }, [])

  async function run(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch (e) {
      setMessage(`문제가 생겼어요: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-headline-sm">알림</h3>
      <p className="text-body-sm text-on-surface-variant">{state ? STATE_TEXT[state] : '확인하는 중…'}</p>
      <div className="flex flex-wrap gap-2">
        {state === 'off' && (
          <Button size="sm" variant="primary" disabled={busy} onClick={() => run(async () => setState(await enablePush()))}>
            <Bell size={16} strokeWidth={1.75} />
            이 기기에서 알림 켜기
          </Button>
        )}
        {state === 'on' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const sent = await sendTestPush()
                  setMessage(sent ? `테스트 알림을 기기 ${sent}개로 보냈어요.` : '보낼 기기를 찾지 못했어요. 알림을 껐다가 다시 켜 주세요.')
                })
              }
            >
              <Send size={16} strokeWidth={1.75} />
              테스트 알림 보내기
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(async () => setState(await disablePush()))}>
              <BellOff size={16} strokeWidth={1.75} />
              알림 끄기
            </Button>
          </>
        )}
      </div>
      {message && <p className="text-body-sm text-on-surface-variant">{message}</p>}
    </section>
  )
}
