/* Las Sombra service worker — runtime cache-first for offline play (PWA). */
const CACHE = 'lasombra-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return
  // never cache dev/HMR payloads or RSC requests
  if (url.pathname.includes('webpack-hmr') || url.searchParams.has('_rsc')) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const hit = await cache.match(req, { ignoreSearch: url.pathname.startsWith('/_next/static/') })
    const network = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        cache.put(req, res.clone()).catch(() => {})
      }
      return res
    }).catch(() => hit)
    return hit || network
  })())
})
