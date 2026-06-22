import { NextRequest, NextResponse } from 'next/server'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { prisma } from '@/lib/db'
import { signMobileToken } from '@/lib/mobile-auth'
import { getDefaultFamily, getUserFamilies } from '@/lib/family'

/**
 * POST /api/mobile/apple — "Sign in with Apple" för mobil-appen.
 *
 * Native-appen (expo-apple-authentication) gör inloggningen lokalt och får en
 * `identityToken` (JWT signerad av Apple). Vi verifierar den server-sidan och
 * utfärdar samma Bearer-token som /api/mobile/login. Publik route (se
 * PUBLIC_PATHS i src/middleware.ts).
 *
 * Kontolänkning speglar webbens Apple-provider (allowDangerousEmailAccountLinking):
 * samma verifierade e-post återanvänder ett befintligt konto i stället för dubblett.
 */

const APPLE_ISSUER = 'https://appleid.apple.com'
// För native Sign in with Apple är token-audiencen appens bundle-id (inte ett
// web-Services-ID). Kan överstyras via env vid behov.
const APPLE_AUDIENCE = process.env.APPLE_APP_BUNDLE_ID || 'nu.vadskavi.laga'
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

export async function POST(request: NextRequest) {
  let body: { identityToken?: unknown; fullName?: unknown; email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }

  const identityToken = typeof body?.identityToken === 'string' ? body.identityToken : ''
  if (!identityToken) {
    return NextResponse.json({ error: 'identityToken krävs' }, { status: 400 })
  }

  // Verifiera Apples identity-token: signatur (RS256 via JWKS) + issuer + audience + exp.
  let sub: string
  let tokenEmail: string | null
  try {
    const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: APPLE_ISSUER,
      audience: APPLE_AUDIENCE,
    })
    sub = String(payload.sub ?? '')
    tokenEmail = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : null
    if (!sub) throw new Error('saknar sub')
  } catch {
    return NextResponse.json({ error: 'Ogiltig Apple-token' }, { status: 401 })
  }

  // Namn + e-post delas bara vid första inloggningen — appen skickar med dem i body.
  const bodyEmail = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : ''
  const email = tokenEmail || bodyEmail || null
  const name =
    typeof body?.fullName === 'string' && body.fullName.trim() ? body.fullName.trim() : null

  let userId: string | null = null

  // 1) Finns redan ett Apple-konto med detta sub?
  const account = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider: 'apple', providerAccountId: sub } },
    select: { userId: true },
  })
  if (account) {
    userId = account.userId
  } else if (email) {
    // 2) Länka in på befintlig användare med samma (verifierade) e-post.
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      userId = existing.id
      await prisma.account.create({
        data: { userId, type: 'oidc', provider: 'apple', providerAccountId: sub },
      })
    }
  }

  // 3) Skapa ny användare + Apple-konto.
  if (!userId) {
    if (!email) {
      return NextResponse.json(
        { error: 'Apple delade ingen e-post. Logga in igen och tillåt e-post.' },
        { status: 400 },
      )
    }
    const created = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: new Date(),
        onboardedAt: new Date(),
        accounts: { create: { type: 'oidc', provider: 'apple', providerAccountId: sub } },
      },
      select: { id: true },
    })
    userId = created.id
  } else if (name) {
    // Fyll i namnet om kontot saknar ett (Apple ger namn bara första gången).
    await prisma.user.updateMany({ where: { id: userId, name: null }, data: { name } })
  }

  const token = signMobileToken(userId)
  // Säkerställ en aktiv gemenskap (auto-skapar vid behov) — samma som /api/mobile/login.
  const activeFamilyId = await getDefaultFamily(userId)
  const families = await getUserFamilies(userId)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json({ token, user, families, activeFamilyId })
}
