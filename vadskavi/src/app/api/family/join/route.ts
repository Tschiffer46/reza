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

  const { inviteCode } = await request.json()
  if (!inviteCode || !inviteCode.trim()) {
    return NextResponse.json({ error: 'Ange en inbjudningskod' }, { status: 400 })
  }

  const family = await prisma.family.findUnique({
    where: { inviteCode: inviteCode.trim().toUpperCase() },
  })
  if (!family) {
    return NextResponse.json({ error: 'Ogiltig inbjudningskod' }, { status: 404 })
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId: family.id } },
  })
  if (!existing) {
    await prisma.membership.create({
      data: { userId, familyId: family.id, role: 'member' },
    })
  }

  const res = NextResponse.json({ id: family.id, name: family.name })
  res.cookies.set(ACTIVE_FAMILY_COOKIE, family.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
