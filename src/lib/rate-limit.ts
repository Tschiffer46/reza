import type { NextRequest } from 'next/server'

/**
 * Enkel takbegränsning i minnet, per nyckel (oftast IP). Appen kör som EN container bakom
 * Nginx Proxy Manager, så en Map räcker — ingen Redis, inget nytt beroende. Räknaren
 * nollställs vid omstart, vilket är acceptabelt för det här syftet: bromsa massregistrering
 * och att man sonderar vilka e-postadresser som har konto.
 */
export function createRateLimiter(maxPerWindow: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return function limited(key: string): boolean {
    const now = Date.now()
    for (const [k, entry] of hits) if (now > entry.resetAt) hits.delete(k)
    const entry = hits.get(key)
    if (!entry) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return false
    }
    entry.count += 1
    return entry.count > maxPerWindow
  }
}

/**
 * Anroparens IP bakom NPM. `x-real-ip` sätts av proxyn och skrivs över vid varje request.
 * `x-forwarded-for` *appendas* till, så ett klientskickat värde hamnar först — läs därför
 * SISTA hoppet, annars kringgår en bot begränsningen genom att rotera en påhittad header.
 */
export function clientIp(request: NextRequest): string {
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  const hops = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return hops.length ? hops[hops.length - 1] : 'okänd'
}
