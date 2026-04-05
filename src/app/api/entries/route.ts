import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const q = searchParams.get('q')
  const sort = searchParams.get('sort') || 'createdAt'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 20

  const where: Record<string, unknown> = {}
  if (type) where.type = type
  if (category) where.category = category
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { instructions: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
      { source: { contains: q, mode: 'insensitive' } },
    ]
  }

  const orderBy: Record<string, string> =
    sort === 'timesCooked'
      ? { timesCooked: 'desc' }
      : sort === 'lastCooked'
        ? { lastCooked: 'desc' }
        : { createdAt: 'desc' }

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.entry.count({ where }),
  ])

  return NextResponse.json({ entries, total, page, pageSize })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, title, category, ingredients, instructions, content, source, url, notes, imageUrls } = body

  if (!title || !type || !category) {
    return NextResponse.json({ error: 'Titel, typ och kategori krävs' }, { status: 400 })
  }

  const entry = await prisma.entry.create({
    data: {
      type,
      title,
      category,
      ingredients: ingredients || [],
      instructions: instructions || null,
      content: content || null,
      source: source || null,
      url: url || null,
      notes: notes || null,
      imageUrls: imageUrls || [],
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
