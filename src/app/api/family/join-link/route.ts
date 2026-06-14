import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ACTIVE_FAMILY_COOKIE, requireUser } from '@/lib/family'

/**
 * GET /api/family/join-link?code=XXXX
 * Går med i gemenskapen bakom inbjudningskoden och skickar vidare till /laga.
 * (GET eftersom den nås via redirect från /join/[code]-sidan.)
 */
export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get('code') || '').trim().toUpperCase()
  if (!code) {
    return NextResponse.redirect(new URL('/laga', request.url))
  }

  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.redirect(new URL(`/login?next=/join/${encodeURIComponent(code)}`, request.url))
  }

  const family = await prisma.family.findUnique({ where: { inviteCode: code } })
  if (!family) {
    return NextResponse.redirect(new URL('/laga', request.url))
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId: family.id } },
  })
  if (!existing) {
    await prisma.membership.create({ data: { userId, familyId: family.id, role: 'member' } })
  }

  const res = NextResponse.redirect(new URL('/laga', request.url))
  res.cookies.set(ACTIVE_FAMILY_COOKIE, family.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
