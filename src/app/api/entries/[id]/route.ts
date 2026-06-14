import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, userFamilyIds, assertMember } from '@/lib/family'
import { deleteImage } from '@/lib/images'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      family: { select: { id: true, name: true } },
      creator: { select: { name: true, email: true } },
      comments: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      changes: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  const familyIds = await userFamilyIds(userId)
  if (!entry || !familyIds.includes(entry.familyId)) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }
  return NextResponse.json(entry)
}

export async function PUT(request: NextRequest, { params }: Params) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.entry.findUnique({ where: { id } })
  const familyIds = await userFamilyIds(userId)
  if (!existing || !familyIds.includes(existing.familyId)) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }

  const body = await request.json()

  // "Lagad"-räknare
  if (body.action === 'cooked') {
    const entry = await prisma.entry.update({
      where: { id },
      data: { timesCooked: { increment: 1 }, lastCooked: new Date() },
    })
    await prisma.changeLog.create({ data: { action: 'cooked', entryId: id, userId } })
    return NextResponse.json(entry)
  }

  // Flytta till annan gemenskap (om angiven och medlem)
  let familyId = existing.familyId
  if (body.familyId && body.familyId !== existing.familyId) {
    try {
      await assertMember(userId, body.familyId)
      familyId = body.familyId
    } catch {
      return NextResponse.json({ error: 'Du tillhör inte den gemenskapen' }, { status: 403 })
    }
  }

  const { type, title, category, blurb, time, servings, ingredients, instructions, content, drinks, source, url, imageUrls } = body
  const entry = await prisma.entry.update({
    where: { id },
    data: {
      type,
      title,
      category,
      blurb: blurb ?? null,
      time: time ?? null,
      servings: typeof servings === 'number' ? servings : null,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: instructions ?? null,
      content: content ?? null,
      drinks: drinks ?? null,
      source: source ?? null,
      url: url ?? null,
      imageUrls: Array.isArray(imageUrls) ? imageUrls : existing.imageUrls,
      familyId,
    },
  })
  await prisma.changeLog.create({ data: { action: 'updated', entryId: id, userId } })
  return NextResponse.json(entry)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.entry.findUnique({ where: { id } })
  const familyIds = await userFamilyIds(userId)
  if (!existing || !familyIds.includes(existing.familyId)) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }

  // Endast betalande medlemmar som är skapare eller gemenskaps-admin får radera.
  const [me, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.membership.findUnique({ where: { userId_familyId: { userId, familyId: existing.familyId } } }),
  ])
  const allowed = me?.plan === 'paid' && (existing.creatorId === userId || membership?.role === 'admin')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Endast betalande medlemmar (skapare eller admin) kan ta bort recept.' },
      { status: 403 },
    )
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { entryId: id } }),
    prisma.note.deleteMany({ where: { entryId: id } }),
    prisma.reaction.deleteMany({ where: { entryId: id } }),
    prisma.rating.deleteMany({ where: { entryId: id } }),
    prisma.changeLog.deleteMany({ where: { entryId: id } }),
    prisma.entry.delete({ where: { id } }),
  ])
  await Promise.all(existing.imageUrls.map((f) => deleteImage(f)))
  return NextResponse.json({ success: true })
}
