import { cookies } from 'next/headers'

const COOKIE_NAME = 'reza-session'
const MAX_AGE_DAYS = 30
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

// Edge-compatible HMAC signing using Web Crypto API
async function sign(timestamp: number): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(timestamp)))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSessionValue(): Promise<string> {
  const timestamp = Date.now()
  const signature = await sign(timestamp)
  return `${timestamp}.${signature}`
}

export async function verifySessionValue(value: string): Promise<boolean> {
  const parts = value.split('.')
  if (parts.length !== 2) return false

  const timestamp = parseInt(parts[0], 10)
  if (isNaN(timestamp)) return false

  // Check if expired
  const ageMs = Date.now() - timestamp
  if (ageMs > MAX_AGE_SECONDS * 1000) return false

  // Verify signature
  const expectedSignature = await sign(timestamp)
  return parts[1] === expectedSignature
}

export function checkPassword(password: string): boolean {
  return password === process.env.REZA_PASSWORD
}

export async function setSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, await createSessionValue(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)
  if (!session) return false
  return verifySessionValue(session.value)
}
