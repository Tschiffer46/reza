import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, getDefaultFamily, userFamilyIds, assertMember } from '@/lib/family'
import { searchEntries } from '@/lib/search'
import { toEntryDTO } from '@/lib/laga'
import { FREE_MONTHLY_LIMIT, monthlyEntryCount } from '@/lib/plan'

export async function GET(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const familyIds = await userFamilyIds(userId)
  const rows = await searchEntries({
    familyIds,
    q: sp.get('q'),
    type: sp.get('type'),
    category: sp.get('category'),
    family: sp.get('family'),
    sort: sp.get('sort'),
  })
  return NextResponse.json({ entries: rows.map(toEntryDTO) })
}

export async function POST(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const body = await request.json()
  const { type, title, category, blurb, time, servings, ingredients, instructions, content, drinks, source, url, imageUrls } = body

  if (!title || !type || !category) {
    return NextResponse.json({ error: 'Titel, typ och kategori krävs' }, { status: 400 })
  }

  // Gratisgräns: max 3 recept/månad. Därutöver förbrukas ev. bonusrecept
  // (välkomstbonus eller admin-kompensation).
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, bonusCredits: true } })
  if (me?.plan !== 'paid') {
    const used = await monthlyEntryCount(userId)
    if (used >= FREE_MONTHLY_LIMIT) {
      if ((me?.bonusCredits ?? 0) > 0) {
        await prisma.user.update({ where: { id: userId }, data: { bonusCredits: { decrement: 1 } } })
      } else {
        return NextResponse.json(
          { error: `Gränsen är nådd (${FREE_MONTHLY_LIMIT} recept/månad). Uppgradera för obegränsat.` },
          { status: 402 },
        )
      }
    }
  }

  // Målgemenskap från body (validera medlemskap), annars standardgemenskapen.
  let familyId = body.familyId as string | undefined
  if (familyId) {
    try {
      await assertMember(userId, familyId)
    } catch {
      return NextResponse.json({ error: 'Du tillhör inte den gemenskapen' }, { status: 403 })
    }
  } else {
    familyId = await getDefaultFamily(userId)
  }

  const entry = await prisma.entry.create({
    data: {
      type,
      title,
      category,
      blurb: blurb || null,
      time: time || null,
      servings: typeof servings === 'number' ? servings : null,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: instructions || null,
      content: content || null,
      drinks: drinks || null,
      source: source || null,
      url: url || null,
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      familyId,
      creatorId: userId,
    },
  })

  await prisma.changeLog.create({
    data: { action: 'created', entryId: entry.id, userId },
  })

  return NextResponse.json(entry, { status: 201 })
}
