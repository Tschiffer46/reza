/**
 * Händelsemappning för RevenueCat-webhooken (`/api/revenuecat/webhook`).
 *
 * Ligger här och inte i route-filen av två skäl: Next.js tillåter bara vissa exports från
 * en `route.ts`, och en ren funktion går att testa utan nätverk eller databas
 * (`npm run test:webhook`).
 *
 * Payloaden från RevenueCat är NÄSTLAD: `{ api_version, event: { type, app_user_id, … } }`.
 * `app_user_id` ÄR vårt `User.id` — appen anropar `Purchases.logIn(user.id)`.
 */

/** Händelser som ger/behåller premium. */
const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
])

/**
 * Händelser som tar bort premium — MEDVETET bara `EXPIRATION`.
 *
 * `CANCELLATION` betyder i RevenueCat att autoförnyelsen stängts av; användaren har kvar sin
 * betalda period tills `EXPIRATION` kommer. Samma sak för `BILLING_ISSUE` (Apple försöker igen)
 * och `SUBSCRIPTION_PAUSED` (pausen börjar först vid periodslut). Lägg ALDRIG till dem här —
 * det stänger av kunder som betalat för innevarande period. Testet vaktar regeln.
 */
const REVOKE_EVENTS = new Set(['EXPIRATION'])

export type PlanChange =
  | { kind: 'set'; userIds: string[]; plan: 'paid' | 'free' }
  | { kind: 'transfer'; from: string[]; to: string[] }
  | { kind: 'ignore'; reason: string }

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v ?? '').trim()).filter(Boolean)
}

/** Ren mappning: RevenueCat-payload → planändring. */
export function mapWebhookEvent(body: unknown, now = Date.now()): PlanChange {
  if (!body || typeof body !== 'object') return { kind: 'ignore', reason: 'ingen payload' }

  const event = (body as Record<string, unknown>).event
  if (!event || typeof event !== 'object') return { kind: 'ignore', reason: 'saknar event' }
  const e = event as Record<string, unknown>

  const type = String(e.type ?? '').toUpperCase()
  if (!type) return { kind: 'ignore', reason: 'saknar type' }

  // TRANSFER bär inte app_user_id, utan vilka id:n prenumerationen flyttats mellan.
  if (type === 'TRANSFER') {
    const from = stringList(e.transferred_from)
    const to = stringList(e.transferred_to)
    if (!from.length && !to.length) return { kind: 'ignore', reason: 'TRANSFER utan id:n' }
    return { kind: 'transfer', from, to }
  }

  const userId = String(e.app_user_id ?? '').trim()
  if (!userId) return { kind: 'ignore', reason: `${type} utan app_user_id` }

  if (REVOKE_EVENTS.has(type)) return { kind: 'set', userIds: [userId], plan: 'free' }

  if (GRANT_EVENTS.has(type)) {
    // Skydd mot omspelade/försenade händelser: en redan utgången period ska inte ge premium.
    const expiresAt = e.expiration_at_ms
    if (typeof expiresAt === 'number' && expiresAt > 0 && expiresAt < now) {
      return { kind: 'ignore', reason: `${type} med utgången expiration_at_ms` }
    }
    return { kind: 'set', userIds: [userId], plan: 'paid' }
  }

  // CANCELLATION, BILLING_ISSUE, SUBSCRIPTION_PAUSED, TEST och okända typer.
  return { kind: 'ignore', reason: `${type} påverkar inte access` }
}
