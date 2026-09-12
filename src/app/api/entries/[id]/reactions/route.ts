import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'
import { findVisibleEntry } from '@/lib/entry-access'

type Params = { params: Promise<{ id: string }> }

/** Toggla hjärta. Returnerar { hearted, count }. */
export async function POST(_request: NextRequest, { params }: Params) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }
  const { id } = await params
  if (!(await findVisibleEntry(id, userId))) {
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
