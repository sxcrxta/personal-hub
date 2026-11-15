// 푸시 알림 켜기·끄기 — 이 브라우저를 푸시 서버에 구독하고, 구독 정보를 push_subscriptions에 남긴다
// 실제 발송은 Supabase의 send-push 함수가 한다 (supabase/functions/send-push)
import { supabase } from './supabase.ts'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushState =
  | 'unsupported' // 이 브라우저는 푸시를 못 받는다
  | 'needs-install' // 아이폰: 홈 화면에 추가한 앱에서만 받을 수 있다
  | 'denied' // 알림을 거부해 두었다 (브라우저·기기 설정에서 풀어야 한다)
  | 'off'
  | 'on'

function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

export async function pushState(): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIos() && !isStandalone() ? 'needs-install' : 'unsupported'
  }
  if (!VAPID_PUBLIC_KEY) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready
  return (await reg.pushManager.getSubscription()) ? 'on' : 'off'
}

/** 알림 권한을 묻고 구독한 뒤 DB에 남긴다. 버튼을 누른 순간에만 불러야 한다(아이폰은 그때만 권한을 물을 수 있다) */
export async function enablePush(): Promise<PushState> {
  if (!VAPID_PUBLIC_KEY) throw new Error('알림 키가 설정되지 않았어요.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY) }))
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    { endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth, device_label: deviceLabel() },
    { onConflict: 'endpoint' },
  )
  if (error) {
    await sub.unsubscribe()
    throw error
  }
  return 'on'
}

export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
  return 'off'
}

/** 내 기기 전부로 테스트 알림을 하나 보낸다. 보낸 기기 수를 돌려준다 */
export async function sendTestPush(): Promise<number> {
  const { data, error } = await supabase.functions.invoke<{ sent: number }>('send-push', { body: { test: true } })
  if (error) throw error
  return data?.sent ?? 0
}

function deviceLabel(): string {
  const ua = navigator.userAgent
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : '기기'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
  return isStandalone() ? `${device} 앱` : `${device} ${browser}`.trim()
}

/** VAPID 공개 키(base64url 글자)를 구독에 넣을 바이트로 바꾼다 */
function base64UrlToBytes(text: string): Uint8Array<ArrayBuffer> {
  const base64 = (text + '='.repeat((4 - (text.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}
