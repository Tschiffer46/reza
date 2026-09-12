import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, userFamilyIds } from '@/lib/family'
import {
  ENTRY_SHARES_INCLUDE,
  canEditEntry,
  canSeeEntry,
  entryFamilies,
  normalizeVisibility,
  resolveEntryTargets,
  syncEntryShares,
} from '@/lib/entry-access'
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
      ...ENTRY_SHARES_INCLUDE,
      creator: { select: { name: true, email: true } },
      comments: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      notes: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      changes: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { reactions: true } },
      reactions: { where: { userId }, select: { id: true } },
    },
  })

  const familyIds = await userFamilyIds(userId)
  const shares = entry?.shares.map((s) => ({ familyId: s.family.id })) ?? []
  if (!canSeeEntry(entry ? { ...entry, shares } : null, userId, familyIds)) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }
  // Plocka ut hjärt-summering (antal + om jag hjärtat) och returnera resten som det är.
  const { _count, reactions, shares: shareRows, ...rest } = entry!
  return NextResponse.json({
    ...rest,
    visibility: normalizeVisibility(entry!.visibility),
    // Alla gemenskaper receptet syns i, primär först (tom lista = privat).
    families: entryFamilies({ visibility: entry!.visibility, family: entry!.family, shares: shareRows }),
    heartCount: _count.reactions,
    hearted: reactions.length > 0,
  })
}

export async function PUT(request: NextRequest, { params }: Params) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.entry.findUnique({
    where: { id },
    include: { shares: { select: { familyId: true } } },
  })
  const familyIds = await userFamilyIds(userId)
  if (!canEditEntry(existing, userId, familyIds)) {
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

  // Synlighet/gemenskaper. Utan `visibility`/`familyIds`/`familyId` i bodyn ligger
  // receptet kvar precis där det låg — äldre klienter (webbens formulär, app-bygge 27)
  // skickar bara `familyId` och ska fortsätta fungera.
  const touchesTargets =
    body.visibility !== undefined || body.familyIds !== undefined || body.familyId !== undefined
  let targets
  try {
    targets = touchesTargets
      ? await resolveEntryTargets(
          userId,
          {
            visibility: body.visibility ?? existing!.visibility,
            familyIds: body.familyIds,
            familyId: body.familyId,
          },
          existing!.familyId,
        )
      : {
          visibility: normalizeVisibility(existing!.visibility),
          familyId: existing!.familyId,
          shareFamilyIds: existing!.shares.map((s) => s.familyId),
        }
  } catch {
    return NextResponse.json({ error: 'Du tillhör inte den gemenskapen' }, { status: 403 })
  }

  const { type, title, category, blurb, time, servings, ingredients, instructions, content, drinks, source, url, imageUrls } = body
  const entry = await prisma.$transaction(async (tx) => {
    const updated = await tx.entry.update({
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
        imageUrls: Array.isArray(imageUrls) ? imageUrls : existing!.imageUrls,
        visibility: targets.visibility,
        familyId: targets.familyId,
      },
    })
    await syncEntryShares(tx, id, targets)
    return updated
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
  const existing = await prisma.entry.findUnique({
    where: { id },
    include: { shares: { select: { familyId: true } } },
  })
  const familyIds = await userFamilyIds(userId)
  if (!canSeeEntry(existing, userId, familyIds)) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }

  // Skapare får alltid radera egna recept; annars krävs betald + gemenskaps-admin
  // (eller global admin). Privata recept har bara en skapare, så den grenen räcker.
  const [me, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, isAdmin: true } }),
    prisma.membership.findUnique({ where: { userId_familyId: { userId, familyId: existing!.familyId } } }),
  ])
  const allowed =
    existing!.creatorId === userId ||
    (normalizeVisibility(existing!.visibility) !== 'private' &&
      ((me?.plan === 'paid' && membership?.role === 'admin') || !!me?.isAdmin))
  if (!allowed) {
    return NextResponse.json(
      { error: 'Du har inte behörighet att ta bort det här receptet.' },
      { status: 403 },
    )
  }

  await prisma.$transaction([
    prisma.entryShare.deleteMany({ where: { entryId: id } }),
    prisma.comment.deleteMany({ where: { entryId: id } }),
    prisma.note.deleteMany({ where: { entryId: id } }),
    prisma.reaction.deleteMany({ where: { entryId: id } }),
    prisma.rating.deleteMany({ where: { entryId: id } }),
    prisma.changeLog.deleteMany({ where: { entryId: id } }),
    prisma.entry.delete({ where: { id } }),
  ])
  await Promise.all(existing!.imageUrls.map((f) => deleteImage(f)))
  return NextResponse.json({ success: true })
}
