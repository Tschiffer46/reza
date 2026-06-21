import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signMobileToken } from '@/lib/mobile-auth'
import { getDefaultFamily, getUserFamilies } from '@/lib/family'

/**
 * POST /api/mobile/login — inloggning för mobil-appen.
 *
 * Tar e-post + lösenord (samma referenser som webbens Credentials-provider,
 * src/auth.ts) och returnerar en Bearer-token som appen skickar på efterföljande
 * /api/*-anrop. Publik route (se PUBLIC_PATHS i src/middleware.ts).
 */
export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }

  const email = String(body?.email ?? '').toLowerCase().trim()
  const password = String(body?.password ?? '')
  if (!email || !password) {
    return NextResponse.json({ error: 'E-post och lösenord krävs' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  // Samma kontroll som Credentials.authorize i src/auth.ts.
  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Fel e-post eller lösenord' }, { status: 401 })
  }

  const token = signMobileToken(user.id)
  // Säkerställ en aktiv gemenskap (auto-skapar vid behov) — samma logik som övriga
  // /api/*-routes via getDefaultFamily, så activeFamilyId aldrig blir null och alltid
  // ingår i families-listan.
  const activeFamilyId = await getDefaultFamily(user.id)
  const families = await getUserFamilies(user.id)

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
    families,
    activeFamilyId,
  })
}
