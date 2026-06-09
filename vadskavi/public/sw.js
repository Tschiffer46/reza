// VadSkaVi service worker — enkel offline-cache.
const CACHE = 'vadskavi-v2'

const OFFLINE_HTML = `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline — Laga</title>
<style>
  body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:'Schibsted Grotesk',system-ui,sans-serif;background:#f6f5f1;color:#1a1a18;text-align:center;padding:24px}
  .pot{width:64px;height:64px;border-radius:18px;background:#c75b39;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
  h1{font-size:22px;margin:0 0 8px;letter-spacing:-.02em}
  p{color:#8a857c;margin:0 0 24px;max-width:32ch;line-height:1.5}
  button{background:#c75b39;color:#fff;border:none;border-radius:12px;padding:12px 22px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}
</style></head><body>
  <div class="pot"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13h14l-1.1 6.1a1.6 1.6 0 0 1-1.6 1.3H7.7a1.6 1.6 0 0 1-1.6-1.3L5 13ZM3.5 13h17M9 13c0-3 1-5.2 3-5.2s3 2.2 3 5.2M12 5.5V4"/></svg></div>
  <h1>Du är offline</h1>
  <p>Det går inte att nå Laga just nu. Kontrollera din anslutning och försök igen.</p>
  <button onclick="location.reload()">Försök igen</button>
</body></html>`

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add('/'))
      .catch(() => {}),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Auth/API: alltid nätverk (cacha aldrig).
  if (url.pathname.startsWith('/api/')) return

  // Navigeringar: network-first med offline-fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(async () => {
          const cached = (await caches.match(req)) || (await caches.match('/'))
          return cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        }),
    )
    return
  }

  // Statiska assets: cache-first.
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (m) =>
          m ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
            return res
          }),
      ),
    )
  }
})
