const CACHE_NAME = 'reza-v3'

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (e) => {
  // Clean up old caches (incl. any blank/error HTML cached by older SW versions)
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

// Minimal self-healing page shown only when a navigation fails AND we have no
// network. It always runs JS, so the user can never get permanently stuck on a
// blank cached shell (the previous black-screen failure mode on iOS PWAs).
const OFFLINE_FALLBACK = `<!DOCTYPE html>
<html lang="sv"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reza — laddar om</title>
<style>body{font-family:system-ui,sans-serif;background:#111;color:#eee;display:flex;
min-height:100vh;margin:0;align-items:center;justify-content:center;text-align:center}
button{font-size:1rem;padding:.75rem 1.25rem;border:0;border-radius:8px;background:#e07a3f;
color:#fff;margin-top:1rem}</style></head>
<body><div><p>Kunde inte nå Reza.</p>
<button onclick="reset()">Ladda om</button>
<script>async function reset(){try{const ks=await caches.keys();
await Promise.all(ks.map(k=>caches.delete(k)));
const rs=await navigator.serviceWorker.getRegistrations();
await Promise.all(rs.map(r=>r.unregister()))}catch(e){}location.reload(true)}</script>
</div></body></html>`

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  // Never cache HTML documents or API calls — always go to the network so a
  // transient bad response can never get stuck and serve a blank app shell.
  if (req.mode === 'navigate' || req.url.includes('/api/')) {
    e.respondWith(
      fetch(req).catch(() =>
        req.mode === 'navigate'
          ? new Response(OFFLINE_FALLBACK, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
          : Response.error()
      )
    )
    return
  }

  // Static assets: network-first with cache fallback for offline use.
  e.respondWith(
    fetch(req)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone))
        }
        return response
      })
      .catch(() => caches.match(req))
  )
})
