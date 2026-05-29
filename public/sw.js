const CACHE_NAME = 'reza-v2'

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (e) => {
  // Clean up old caches
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

// Network-first strategy — personal app, always online
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response.ok && !e.request.url.includes('/api/')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        }
        return response
      })
      .catch(() => caches.match(e.request))
  )
})
