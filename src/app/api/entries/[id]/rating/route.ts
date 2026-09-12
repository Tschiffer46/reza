import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'
import { findVisibleEntry } from '@/lib/entry-access'

type Params = { params: Promise<{ id: string }> }

/** Sätt/uppdatera eget betyg (1–6) och räkna om snittet. */
export async function POST(request: NextRequest, { params }: Params) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }
  const { id } = await params

  if (!(await findVisibleEntry(id, userId))) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }

  const { score } = await request.json()
  const value = Number(score)
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    return NextResponse.json({ error: 'Betyg måste vara 1–6' }, { status: 400 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.rating.upsert({
      where: { entryId_userId: { entryId: id, userId } },
      update: { score: value },
      create: { entryId: id, userId, score: value },
    })
    const agg = await tx.rating.aggregate({
      where: { entryId: id },
      _avg: { score: true },
      _count: true,
    })
    return tx.entry.update({
      where: { id },
      data: { ratingAvg: agg._avg.score, ratingCount: agg._count },
      select: { ratingAvg: true, ratingCount: true },
    })
  })

  return NextResponse.json({ ...updated, myScore: value })
}
