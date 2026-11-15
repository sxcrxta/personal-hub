// 서비스 워커 등록 — public/sw.js를 브라우저에 한 번 올려 둔다. 푸시 알림과 '홈 화면에 추가'에 필요하다
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('서비스 워커를 등록하지 못했어요.', e))
  })
}
