/* UnifiedTree Accounting — Service Worker
   Strategy:
   - App shell (HTML/CSS/JS): Cache-first, update in background
   - API / data fetches:      Network-first, fall back to cache
   - Static assets:           Cache-first, 7-day max-age
*/

const CACHE_NAME  = 'ut-accounting-v2'
const SHELL_URLS  = ['/', '/index.html']

/* ── Install: pre-cache shell ── */
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  )
})

/* ── Activate: purge old caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

/* ── Fetch: cache strategy ── */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, cross-origin, and browser-extension requests
  if (request.method !== 'GET') return
  if (url.origin !== location.origin) return
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') return
  if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/.vite/')) return

  // App shell — cache first
  if (SHELL_URLS.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(cacheFirst(request))
    return
  }

  // Static assets (fonts, images, JS, CSS)
  if (/\.(js|css|woff2?|svg|png|jpg|ico|json)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Everything else — network first
  event.respondWith(networkFirst(request))
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const shell = await caches.match('/index.html')
      if (shell) return shell
    }
    return new Response('Offline — please check your connection', { status: 503 })
  }
}

/* ── Push notifications (future use) ── */
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'UnifiedTree', {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag ?? 'ut-notification',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url === target)
      if (existing) return existing.focus()
      return self.clients.openWindow(target)
    })
  )
})
