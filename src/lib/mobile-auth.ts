import { createHmac, timingSafeEqual, randomUUID } from 'crypto'
import { headers } from 'next/headers'

/**
 * Bearer-token-auth för mobil-appen (VadSkaVi Laga).
 *
 * Webben autentiserar via NextAuth-sessionscookie, men en native-app kan inte
 * hantera HTTP-only-cookies. Här utfärdar vi i stället en signerad HS256-JWT som
 * appen skickar i `Authorization: Bearer <token>`. Token signeras med samma
 * `AUTH_SECRET` som NextAuth redan använder, så ingen ny server-env krävs.
 *
 * Tokenen är statslös (ingen DB-tabell) — `requireUser()` i src/lib/family.ts
 * verifierar den och faller tillbaka på cookie-sessionen för webben.
 */

const TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 dagar

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET saknas — kan inte signera mobil-token')
  return secret
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url')
}

/** Skapa en HS256-JWT för mobil-appen. */
export function signMobileToken(userId: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64url(
    JSON.stringify({ sub: userId, iat: now, exp: now + TOKEN_TTL_SECONDS, jti: randomUUID() }),
  )
  const data = `${header}.${payload}`
  return `${data}.${sign(data)}`
}

/** Verifiera en mobil-Bearer-token. Returnerar userId, eller null om ogiltig/utgången. */
export function verifyMobileToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts

  // Timing-säker signaturjämförelse.
  const expected = sign(`${header}.${payload}`)
  const got = Buffer.from(signature)
  const want = Buffer.from(expected)
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!claims?.sub) return null
    if (typeof claims.exp === 'number' && claims.exp < Math.floor(Date.now() / 1000)) return null
    return String(claims.sub)
  } catch {
    return null
  }
}

/**
 * Läs `Authorization: Bearer <token>` från den aktuella requesten och returnera
 * userId, eller null om ingen giltig token finns. Anropas från `requireUser()`.
 */
export async function getBearerUserId(): Promise<string | null> {
  const hdrs = await headers()
  const authHeader = hdrs.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return null
  return verifyMobileToken(token)
}
