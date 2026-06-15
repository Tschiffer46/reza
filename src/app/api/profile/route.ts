import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'

export async function GET() {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, avatar: true, bio: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const body = await request.json()
  const data: { name?: string | null; bio?: string | null; avatar?: string | null } = {}
  if ('name' in body) data.name = body.name && String(body.name).trim() ? String(body.name).trim() : null
  if ('bio' in body) data.bio = body.bio && String(body.bio).trim() ? String(body.bio).trim() : null
  if ('avatar' in body) data.avatar = body.avatar ? String(body.avatar) : null

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { name: true, email: true, avatar: true, bio: true },
  })
  return NextResponse.json(user)
}
