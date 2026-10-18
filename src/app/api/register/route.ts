import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * POST /api/register — skapa konto med e-post + lösenord på webben. Publik route.
 *
 * Ändrar ALDRIG ett befintligt konto. Finns adressen redan svarar vi 409, även om kontot
 * saknar lösenord. Routen satte tidigare lösenordet på ett sådant konto — men konton från
 * Apple, Google och magic link saknar lösenord, så vem som helst som kände till adressen
 * kunde välja ett lösenord och sedan logga in som användaren via Credentials eller
 * /api/mobile/login. Lösenord på ett befintligt konto sätts inloggad (PATCH
 * /api/profile/password), aldrig anonymt.
 */

const EXISTS = 'Ett konto med den e-posten finns redan'

export async function POST(request: NextRequest) {
  const { email: rawEmail, password, name } = await request.json()
  const email = String(rawEmail ?? '').toLowerCase().trim()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ange en giltig e-postadress' }, { status: 400 })
  }
  if (!password || String(password).length < 8) {
    return NextResponse.json({ error: 'Lösenordet måste vara minst 8 tecken' }, { status: 400 })
  }

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: EXISTS }, { status: 409 })
  }

  try {
    await prisma.user.create({
      data: { email, password: await bcrypt.hash(String(password), 10), name: name?.trim() || null },
    })
  } catch (e) {
    // Två samtidiga registreringar med samma adress: unik-constrainten avgör.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: EXISTS }, { status: 409 })
    }
    throw e
  }

  return NextResponse.json({ ok: true })
}
