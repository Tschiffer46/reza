import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, getDefaultFamily, userFamilyIds, assertMember } from '@/lib/family'
import { searchEntries } from '@/lib/search'

export async function GET(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const familyIds = await userFamilyIds(userId)
  const entries = await searchEntries({
    familyIds,
    q: sp.get('q'),
    type: sp.get('type'),
    category: sp.get('category'),
    family: sp.get('family'),
    sort: sp.get('sort'),
  })
  return NextResponse.json({ entries })
}

export async function POST(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const body = await request.json()
  const { type, title, category, ingredients, instructions, content, drinks, source, url, imageUrls } = body

  if (!title || !type || !category) {
    return NextResponse.json({ error: 'Titel, typ och kategori krävs' }, { status: 400 })
  }

  // Målfamilj från body (validera medlemskap), annars standardfamiljen.
  let familyId = body.familyId as string | undefined
  if (familyId) {
    try {
      await assertMember(userId, familyId)
    } catch {
      return NextResponse.json({ error: 'Du tillhör inte den familjen' }, { status: 403 })
    }
  } else {
    familyId = await getDefaultFamily(userId)
  }

  const entry = await prisma.entry.create({
    data: {
      type,
      title,
      category,
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
