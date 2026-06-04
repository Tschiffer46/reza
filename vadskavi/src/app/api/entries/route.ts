import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireFamily } from '@/lib/family'
import { searchEntries } from '@/lib/search'

export async function GET(request: NextRequest) {
  let ctx
  try {
    ctx = await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const entries = await searchEntries({
    familyId: ctx.familyId,
    q: sp.get('q'),
    type: sp.get('type'),
    category: sp.get('category'),
    sort: sp.get('sort'),
  })
  return NextResponse.json({ entries })
}

export async function POST(request: NextRequest) {
  let ctx
  try {
    ctx = await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const body = await request.json()
  const { type, title, category, ingredients, instructions, content, drinks, source, url } = body

  if (!title || !type || !category) {
    return NextResponse.json({ error: 'Titel, typ och kategori krävs' }, { status: 400 })
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
      familyId: ctx.familyId,
      creatorId: ctx.userId,
    },
  })

  await prisma.changeLog.create({
    data: { action: 'created', entryId: entry.id, userId: ctx.userId },
  })

  return NextResponse.json(entry, { status: 201 })
}
