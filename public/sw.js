// 서비스 워커 — 브라우저 뒤에서 도는 작은 프로그램. 앱이 닫혀 있어도 푸시를 받아 알림을 띄우고, 알림을 누르면 앱을 연다
// 화면 파일을 저장해 두는 오프라인 기능은 넣지 않는다(CLAUDE.md 3절). 새 버전이 배포되면 바로 그 버전을 쓴다

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// 서버가 보낸 푸시: { title, body, url, tag }
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Personal Hub', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag, // 같은 tag면 앞 알림을 덮어써서 같은 알림이 쌓이지 않는다
      data: { url: data.url || '/today' },
    }),
  )
})

// 알림을 누르면 열려 있는 앱 창을 앞으로 가져오고, 없으면 새로 연다
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/today', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus()
          if ('navigate' in client) await client.navigate(url)
          return
        }
      }
      await self.clients.openWindow(url)
    })(),
  )
})
