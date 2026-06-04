import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ACTIVE_FAMILY_COOKIE, requireUser } from '@/lib/family'

export async function POST(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { familyId } = await request.json()
  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Du är inte medlem i den familjen' }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ACTIVE_FAMILY_COOKIE, familyId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
