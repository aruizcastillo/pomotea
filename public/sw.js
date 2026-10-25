/* The build fills this list. No background countdown runs in this worker. */
const PRECACHE = []
const CACHE = 'pomotea-static-development'

self.addEventListener('install', (event) => {
  if (PRECACHE.length) event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => key.startsWith('pomotea-static-') && key !== CACHE).map(key => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  if (!PRECACHE.length || event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    if (!['/', '/es', '/es/'].includes(url.pathname)) return
    // Keep a coherent app version until the next worker activates.
    const path = url.pathname.startsWith('/es') ? '/es/index.html' : '/index.html'
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(path)) ?? fetch(event.request)))
  }
  else if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) ?? fetch(event.request)))
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const path = event.notification.data?.url === '/es' ? '/es' : '/'
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin)
    if (existing) await existing.focus()
    else await self.clients.openWindow(path)
  })())
})
