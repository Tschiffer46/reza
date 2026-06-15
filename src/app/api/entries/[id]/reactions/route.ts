import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, userFamilyIds } from '@/lib/family'

type Params = { params: Promise<{ id: string }> }

async function canAccess(entryId: string, userId: string) {
  const entry = await prisma.entry.findUnique({ where: { id: entryId } })
  if (!entry) return false
  const ids = await userFamilyIds(userId)
  return ids.includes(entry.familyId)
}

/** Toggla hjärta. Returnerar { hearted, count }. */
export async function POST(_request: NextRequest, { params }: Params) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }
  const { id } = await params
  if (!(await canAccess(id, userId))) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }

  const existing = await prisma.reaction.findUnique({
    where: { entryId_userId: { entryId: id, userId } },
  })
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.reaction.create({ data: { entryId: id, userId } })
  }
  const count = await prisma.reaction.count({ where: { entryId: id } })
  return NextResponse.json({ hearted: !existing, count })
}
