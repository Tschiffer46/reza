import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { clientIp, createRateLimiter } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Samma gräns som /api/mobile/register: bromsar massregistrering och sondering av adresser.
const rateLimited = createRateLimiter(5, 15 * 60 * 1000)

/**
 * POST /api/register — skapa konto med e-post + lösenord på webben.
 *
 * Registrering skapar BARA nya konton. Finns adressen redan svarar vi 409, även om kontot
 * saknar lösenord.
 *
 * Förut satte routen i det läget lösenordet på det befintliga kontot ("magic link-användare
 * utan lösenord → sätt lösenord"). Konton från Apple-inloggning och magic link saknar
 * lösenord, så vem som helst som kände till en adress kunde välja ett lösenord åt den
 * användaren och sedan logga in som hen — utan att någonsin bevisa att hen äger adressen.
 * Den som saknar lösenord loggar i stället in med e-postlänk/Apple/Google och väljer
 * lösenord inloggad (PATCH /api/profile/password).
 */
export async function POST(request: NextRequest) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: 'För många försök. Vänta en stund och prova igen.' }, { status: 429 })
  }

  let body: { email?: unknown; password?: unknown; name?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }
  const email = String(body?.email ?? '').toLowerCase().trim()
  const password = typeof body?.password === 'string' ? body.password : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Ange en giltig e-postadress' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Lösenordet måste vara minst 8 tecken' }, { status: 400 })
  }

  const exists =
    'Det finns redan ett konto med den e-postadressen. Logga in i stället — har du inget lösenord kan du logga in med en e-postlänk, Apple eller Google.'
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: exists }, { status: 409 })
  }

  try {
    await prisma.user.create({
      data: { email, password: await bcrypt.hash(password, 10), name: name || null },
    })
  } catch (e) {
    // Två samtidiga registreringar med samma adress: unik-constrainten avgör.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: exists }, { status: 409 })
    }
    throw e
  }

  return NextResponse.json({ ok: true })
}
