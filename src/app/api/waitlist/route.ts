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

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'okänd'
  sweep()
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'För många försök. Vänta en stund och prova igen.' },
      { status: 429 },
    )
  }

  // Samma adress två gånger ska varken ge dubbelrader eller ett felmeddelande
  // i ansiktet på någon som bara klickade en gång för mycket.
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
