import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Publika sökvägar som inte kräver inloggning.
// /api/register + /api/auth nås av utloggade användare (kontoskapande/inloggning).
// Den publika marknadsförings-/SEO-ytan (recept, om, kontakt, juridiska sidor) samt
// crawler-/delningsresurser (robots, sitemap, OG-bild, statiska bilder i /public/img)
// måste vara publika – annars redirectas crawlers till /login.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/join',
  '/recept',
  '/om',
  '/kontakt',
  '/integritetspolicy',
  '/cookiepolicy',
  '/om-annonslankar',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
  '/img',
  '/api/auth',
  '/api/register',
  '/api/mobile/login',
  '/api/mobile/apple',
  '/api/debug',
]

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

  // Mobil-appen skickar `Authorization: Bearer <token>` i stället för sessionscookie.
  // Bara API-anrop får passera grinden via header (den riktiga token-valideringen sker
  // i route-handlern, requireUser → getBearerUserId). Sidor (t.ex. /laga, /admin) ska
  // inte kunna kringgå redirecten med en godtycklig Authorization-header.
  const hasBearer =
    pathname.startsWith('/api/') &&
    (req.headers.get('authorization')?.startsWith('Bearer ') ?? false)
  const hasSession =
    hasBearer ||
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
