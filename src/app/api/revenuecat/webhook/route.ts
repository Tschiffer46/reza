import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mapWebhookEvent } from '@/lib/revenuecat'

/**
 * POST /api/revenuecat/webhook — entitlement-sync från RevenueCat (server-to-server).
 *
 * Appen binder köp till vårt `User.id` via `Purchases.logIn(user.id)`, så RevenueCats
 * `app_user_id` ÄR vårt användar-id. Härifrån speglas prenumerationshändelser till
 * `User.plan` ('paid'/'free').
 *
 * Publik route (PUBLIC_PATHS i src/middleware.ts) skyddad av en delad hemlighet: RevenueCat
 * skickar det värde man satt i deras dashboard som `Authorization`-header. Utan env
 * `REVENUECAT_WEBHOOK_SECRET` svarar vi 503 = avstängd, så en felkonfigurerad server aldrig
 * tyst accepterar osignerade anrop.
 *
 * Själva händelsemappningen ligger i `src/lib/revenuecat.ts` (ren funktion, testad via
 * `npm run test:webhook`) — bl.a. för att Next.js bara tillåter vissa exports härifrån.
 */

/** Timing-säker jämförelse (undviker att läcka längd/prefix via svarstid). */
function secretMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

/** RevenueCat skickar hemligheten som `Authorization`-header (med eller utan `Bearer `-prefix). */
function isAuthorized(request: NextRequest, secret: string): boolean {
  const header = request.headers.get('authorization')
  if (!header) return false
  return secretMatches(header.replace(/^Bearer\s+/i, '').trim(), secret)
}

/** `updateMany` för att inte kasta om användaren hunnit raderas (0 rader = ok). */
async function setPlan(userIds: string[], plan: 'paid' | 'free'): Promise<number> {
  if (!userIds.length) return 0
  const res = await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { plan } })
  return res.count
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook ej konfigurerad' }, { status: 503 })
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: 'Ogiltig hemlighet' }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(await request.text())
  } catch {
    return NextResponse.json({ error: 'Ogiltig JSON' }, { status: 400 })
  }

  const change = mapWebhookEvent(body)

  // Okända/icke-påverkande händelser besvaras 200 så RevenueCat inte retry-stormar.
  if (change.kind === 'ignore') {
    console.log('[revenuecat] ignorerar:', change.reason)
    return NextResponse.json({ ok: true, ignored: true })
  }

  if (change.kind === 'transfer') {
    const [lost, gained] = await Promise.all([
      setPlan(change.from, 'free'),
      setPlan(change.to, 'paid'),
    ])
    console.log('[revenuecat] TRANSFER →', { from: lost, to: gained })
    return NextResponse.json({ ok: true })
  }

  const count = await setPlan(change.userIds, change.plan)
  console.log('[revenuecat] plan =', change.plan, 'för', change.userIds.join(','), `(${count} rad)`)
  return NextResponse.json({ ok: true })
}
