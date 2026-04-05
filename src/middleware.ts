import { NextRequest, NextResponse } from 'next/server'
import { verifySessionValue } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth', '/manifest.json', '/sw.js']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next()
  }

  // Check session cookie
  const session = request.cookies.get('reza-session')
  if (!session || !(await verifySessionValue(session.value))) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
