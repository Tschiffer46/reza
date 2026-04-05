const CACHE_NAME = 'reza-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
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
