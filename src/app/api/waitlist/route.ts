import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getApp } from '@/lib/apps'
import { clientIp, createRateLimiter } from '@/lib/rate-limit'

/**
 * Intresseanmälan inför App Store-släpp. PUBLIK endpoint — måste ligga i
 * PUBLIC_PATHS i src/middleware.ts, annars 307:as POST:en till /login och
 * svarar 405.
 *
 * Ingen ny tabell: anmälan sparas som en `Feedback`-rad utan `userId`
 * (`type: 'waitlist'`, `message` = appens namn) och syns därmed direkt i
 * admin-vyn tillsammans med övrig inkommande post.
 */

// 5 anmälningar per 10 minuter och IP. Delad implementation med registreringen — se
// src/lib/rate-limit.ts för varför vi läser SISTA x-forwarded-for-hoppet.
const rateLimited = createRateLimiter(5, 10 * 60 * 1000)

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

  if (rateLimited(clientIp(request))) {
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
