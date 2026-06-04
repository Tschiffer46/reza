import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireFamily } from '@/lib/family'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  let ctx
  try {
    ctx = await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true, email: true } },
      comments: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!entry || entry.familyId !== ctx.familyId) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }
  return NextResponse.json(entry)
}

export async function PUT(request: NextRequest, { params }: Params) {
  let ctx
  try {
    ctx = await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.entry.findUnique({ where: { id } })
  if (!existing || existing.familyId !== ctx.familyId) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }

  const body = await request.json()

  // "Lagad"-räknare
  if (body.action === 'cooked') {
    const entry = await prisma.entry.update({
      where: { id },
      data: { timesCooked: { increment: 1 }, lastCooked: new Date() },
    })
    await prisma.changeLog.create({
      data: { action: 'cooked', entryId: id, userId: ctx.userId },
    })
    return NextResponse.json(entry)
  }

  const { type, title, category, ingredients, instructions, content, drinks, source, url } = body
  const entry = await prisma.entry.update({
    where: { id },
    data: {
      type,
      title,
      category,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: instructions ?? null,
      content: content ?? null,
      drinks: drinks ?? null,
      source: source ?? null,
      url: url ?? null,
    },
  })
  await prisma.changeLog.create({
    data: { action: 'updated', entryId: id, userId: ctx.userId },
  })
  return NextResponse.json(entry)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  let ctx
  try {
    ctx = await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.entry.findUnique({ where: { id } })
  if (!existing || existing.familyId !== ctx.familyId) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }

  // Ta bort barn-rader först (inga cascades i schemat).
  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { entryId: id } }),
    prisma.changeLog.deleteMany({ where: { entryId: id } }),
    prisma.entry.delete({ where: { id } }),
  ])
  return NextResponse.json({ success: true })
}
