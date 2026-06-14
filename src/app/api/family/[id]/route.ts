import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId: id } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Du är inte medlem i den gemenskapen' }, { status: 403 })
  }

  const body = await request.json()
  const data: { name?: string; background?: string } = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (typeof body.background === 'string') data.background = body.background
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Inget att uppdatera' }, { status: 400 })
  }

  const family = await prisma.family.update({ where: { id }, data })
  return NextResponse.json({ id: family.id, name: family.name, background: family.background })
}
