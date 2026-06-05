import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Publika sökvägar som inte kräver inloggning.
const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth']

/**
 * Lättviktig auth-grind: kontrollerar att en Auth.js-sessionscookie finns.
 * Körs i Edge-runtime, så vi rör inte databasen här — den fullständiga
 * sessionsvalideringen sker i server-komponenter via `auth()`.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
  if (isPublic) return NextResponse.next()

  const hasSession =
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token')

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Matcha allt utom statiska assets, bilder och PWA-filer.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)'],
}
