import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getApp } from '@/lib/apps'

/**
 * Intresseanmälan inför App Store-släpp. PUBLIK endpoint — måste ligga i
 * PUBLIC_PATHS i src/middleware.ts, annars 307:as POST:en till /login och
 * svarar 405.
 *
 * Ingen ny tabell: anmälan sparas som en `Feedback`-rad utan `userId`
 * (`type: 'waitlist'`, `message` = appens namn) och syns därmed direkt i
 * admin-vyn tillsammans med övrig inkommande post.
 */

const MAX_PER_WINDOW = 5
const WINDOW_MS = 10 * 60 * 1000

/**
 * Enkel takbegränsning per IP. Sajten körs som en enda container bakom Nginx
 * Proxy Manager, så en Map i minnet räcker — ingen Redis, inget nytt beroende.
 * Nollställs vid omdeploy, vilket är helt acceptabelt för det här ändamålet.
 */
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_PER_WINDOW
}

/** Städar bort utgångna poster så att Map:en inte växer i all oändlighet. */
function sweep() {
  const now = Date.now()
  for (const [ip, entry] of hits) if (now > entry.resetAt) hits.delete(ip)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Anroparens IP, så gott det går bakom Nginx Proxy Manager.
 *
 * `x-real-ip` sätts av proxyn till den faktiska peer-adressen och skrivs över
 * vid varje request ⇒ går inte att förfalska. `x-forwarded-for` däremot
 * *appendas* till (`$proxy_add_x_forwarded_for`), så ett klientskickat värde
 * hamnar först i listan medan vår proxys observation hamnar sist. Att läsa
 * första värdet skulle därför göra takbegränsningen trivial att kringgå — en
 * bot behöver bara rotera en påhittad header. Vi läser sista värdet.
 */
function clientIp(request: NextRequest): string {
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const hops = forwarded
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (hops.length > 0) return hops[hops.length - 1]
  }

  return 'okänd'
}

export async function POST(request: NextRequest) {
  let body: { app?: string; email?: string; company?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }

  // Honeypot: fältet är dolt i formuläret, så bara robotar fyller i det.
  // Svara 200 ändå — en bot ska inte få veta att den fastnade.
  if (body.company) return NextResponse.json({ ok: true })

  const app = getApp(String(body.app ?? ''))
  if (!app) {
    return NextResponse.json({ error: 'Okänd app' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: 'Skriv en giltig e-postadress' }, { status: 400 })
  }

  const ip = clientIp(request)
  sweep()
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'För många försök. Vänta en stund och prova igen.' },
      { status: 429 },
    )
  }

  // Dedupe: samma adress två gånger ska inte ge en till rad, och framför allt
  // inte ett felmeddelande i ansiktet på någon som klickade en gång för mycket.
  //
  // Medvetet best effort — kontrollen och insert:en är inte atomiska, så två
  // exakt samtidiga POST:ar kan båda slinka förbi. Värsta utfallet är en
  // dubblettrad i admin-listan, och formuläret spärrar redan knappen medan det
  // skickar. En Serializable-transaktion med retry (eller ett partiellt unikt
  // index, som Prisma inte kan uttrycka och som `db push` därför inte skulle
  // sätta) kostar mer komplexitet än vad en kosmetisk dubblett är värd.
  const existing = await prisma.feedback.findFirst({
    where: { type: 'waitlist', email, message: app.name },
    select: { id: true },
  })
  if (existing) return NextResponse.json({ ok: true })

  await prisma.feedback.create({
    data: { userId: null, email, type: 'waitlist', message: app.name },
  })

  return NextResponse.json({ ok: true })
}
