import { importPKCS8, SignJWT } from 'jose'
import { prisma } from '@/lib/db'

/**
 * Sign in with Apple — token-utbyte & revokering (Apples REST-API).
 *
 * Apple kräver att appar med Sign in with Apple revokerar användarens tokens när
 * kontot raderas (App Review, Guideline 5.1.1(v)). Revokering kräver en
 * refresh_token, som bara fås genom att byta in `authorizationCode` från
 * inloggningen — därför gör /api/mobile/apple utbytet direkt vid login och
 * sparar refresh_token på Apple-`Account`-raden.
 *
 * Allt är env-gated: utan APPLE_TEAM_ID + APPLE_KEY_ID + APPLE_PRIVATE_KEY blir
 * både utbyte och revokering tysta no-ops (kontoradering fungerar ändå).
 * client_id = appens bundle-id (samma som identityToken-verifieringens aud).
 */

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token'
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke'
const CLIENT_ID = process.env.APPLE_APP_BUNDLE_ID || 'nu.vadskavi.laga'

function revokeConfigured(): boolean {
  return Boolean(
    process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY,
  )
}

/** Apples "client secret" är en kortlivad ES256-JWT signerad med SIWA-nyckeln (.p8). */
async function buildClientSecret(): Promise<string> {
  // .p8-innehållet lagras i env med \n som radbrytningar (kompatibelt med .env-filer).
  const pem = String(process.env.APPLE_PRIVATE_KEY).replace(/\\n/g, '\n')
  const key = await importPKCS8(pem, 'ES256')
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID })
    .setIssuer(String(process.env.APPLE_TEAM_ID))
    .setIssuedAt(now)
    .setExpirationTime(now + 10 * 60)
    .setAudience('https://appleid.apple.com')
    .setSubject(CLIENT_ID)
    .sign(key)
}

/**
 * Byt authorizationCode → refresh_token och spara den på Apple-Account-raden.
 * Best effort: fel loggas men kastas aldrig (inloggningen får inte falla på detta).
 */
export async function exchangeAndStoreAppleRefreshToken(
  userId: string,
  authorizationCode: string,
): Promise<void> {
  if (!revokeConfigured()) return
  try {
    const clientSecret = await buildClientSecret()
    const res = await fetch(APPLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      }),
    })
    if (!res.ok) {
      console.error('[apple-revoke] code-utbyte misslyckades:', res.status, await res.text())
      return
    }
    const data = (await res.json()) as { refresh_token?: string }
    if (!data.refresh_token) return
    await prisma.account.updateMany({
      where: { userId, provider: 'apple' },
      data: { refresh_token: data.refresh_token },
    })
  } catch (e) {
    console.error('[apple-revoke] code-utbyte misslyckades:', e)
  }
}

/**
 * Revokera användarens Apple-tokens (vid kontoradering). Best effort: fel loggas
 * men kastas aldrig — raderingen ska alltid gå igenom.
 */
export async function revokeAppleTokens(userId: string): Promise<void> {
  if (!revokeConfigured()) return
  try {
    const account = await prisma.account.findFirst({
      where: { userId, provider: 'apple', refresh_token: { not: null } },
      select: { refresh_token: true },
    })
    if (!account?.refresh_token) return
    const clientSecret = await buildClientSecret()
    const res = await fetch(APPLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: clientSecret,
        token: account.refresh_token,
        token_type_hint: 'refresh_token',
      }),
    })
    if (!res.ok) {
      console.error('[apple-revoke] revokering misslyckades:', res.status, await res.text())
    }
  } catch (e) {
    console.error('[apple-revoke] revokering misslyckades:', e)
  }
}
