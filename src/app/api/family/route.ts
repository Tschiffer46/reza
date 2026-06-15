import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  ACTIVE_FAMILY_COOKIE,
  createFamilyForUser,
  getActiveFamily,
  requireUser,
} from '@/lib/family'

export async function GET() {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const activeId = await getActiveFamily(userId)
  const [memberships, active] = await Promise.all([
    prisma.membership.findMany({
      where: { userId },
      include: { family: { select: { id: true, name: true } } },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.family.findUnique({
      where: { id: activeId },
      include: {
        members: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    }),
  ])

  return NextResponse.json({
    activeId,
    families: memberships.map((m) => ({ id: m.family.id, name: m.family.name, role: m.role })),
    active: active && {
      id: active.id,
      name: active.name,
      inviteCode: active.inviteCode,
      background: active.background,
      coverImage: active.coverImage,
      members: active.members.map((m) => ({
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
    },
  })
}

export async function POST(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }
  const { name } = await request.json()
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Ange ett gemenskapenamn' }, { status: 400 })
  }
  const familyId = await createFamilyForUser(userId, name)
  const res = NextResponse.json({ id: familyId }, { status: 201 })
  res.cookies.set(ACTIVE_FAMILY_COOKIE, familyId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
