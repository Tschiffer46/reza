import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/purchasely/webhook — entitlement-sync från Purchasely (server-to-server).
 *
 * Appen binder köp till vårt User.id via `Purchasely.userLogin(user.id)`; Purchasely
 * skickar sedan prenumerationshändelser hit och vi speglar dem till `User.plan`
 * ('paid'/'free'). Publik route (PUBLIC_PATHS i src/middleware.ts) skyddad av delad
 * hemlighet: env `PURCHASELY_WEBHOOK_SECRET` (utan env svarar vi 503 = avstängd).
 *
 * Verifiering (tolerant — stäm av mot Purchaselys webhook-doc när konsolen sätts upp):
 *  1) HMAC-SHA256-signatur: `X-PURCHASELY-SIGNATURE` = HMAC(secret, timestamp + rawBody)
 *     med `X-PURCHASELY-TIMESTAMP`.
 *  2) Fallback: hemligheten skickad rakt av i `Authorization` eller `X-WEBHOOK-SECRET`.
 *
 * Payload-mappning är avsiktligt tolerant (fält-fallbacks) och okända händelser
 * loggas + besvaras 200 så Purchasely inte retry-stormar.
 */

// Händelser som ger/behåller premium respektive tar bort den. Övriga ignoreras.
const PAID_EVENTS = new Set([
  'ACTIVATE',
  'SUBSCRIBE',
  'RENEW',
  'RECOVER',
  'PURCHASE',
  'REACTIVATE',
  'UNPAUSE',
])
const FREE_EVENTS = new Set(['DEACTIVATE', 'EXPIRE', 'EXPIRED', 'REVOKE', 'REFUND', 'CANCEL'])

function verifySecret(request: NextRequest, rawBody: string, secret: string): boolean {
  const signature = request.headers.get('x-purchasely-signature')
  const timestamp = request.headers.get('x-purchasely-timestamp') ?? ''
  if (signature) {
    const expected = createHmac('sha256', secret).update(`${timestamp}${rawBody}`).digest('hex')
    const got = Buffer.from(signature)
    const want = Buffer.from(expected)
    return got.length === want.length && timingSafeEqual(got, want)
  }
  const direct =
    request.headers.get('x-webhook-secret') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(direct && direct === secret)
}

export async function POST(request: NextRequest) {
  const secret = process.env.PURCHASELY_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook ej konfigurerad' }, { status: 503 })
  }

  const rawBody = await request.text()
  if (!verifySecret(request, rawBody, secret)) {
    return NextResponse.json({ error: 'Ogiltig signatur' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Ogiltig JSON' }, { status: 400 })
  }

  // user_id = vårt User.id (satt av appen via Purchasely.userLogin).
  const user = event.user as Record<string, unknown> | undefined
  const userId = String(event.user_id ?? event.app_user_id ?? user?.vendor_id ?? '')
  const eventName = String(event.event_name ?? event.event ?? '').toUpperCase()

  if (!userId || !eventName) {
    console.warn('[purchasely] händelse utan user_id/event_name:', rawBody.slice(0, 500))
    return NextResponse.json({ ok: true, ignored: true })
  }

  const plan = PAID_EVENTS.has(eventName) ? 'paid' : FREE_EVENTS.has(eventName) ? 'free' : null
  if (!plan) {
    console.log('[purchasely] ignorerar händelse', eventName, 'för', userId)
    return NextResponse.json({ ok: true, ignored: true })
  }

  // updateMany för att inte kasta om användaren hunnit raderas (0 rader = ok).
  const res = await prisma.user.updateMany({ where: { id: userId }, data: { plan } })
  console.log('[purchasely]', eventName, '→ plan =', plan, 'för', userId, `(${res.count} rad)`)
  return NextResponse.json({ ok: true })
}
