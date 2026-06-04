import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireFamily } from '@/lib/family'

export async function GET(request: NextRequest) {
  let ctx
  try {
    ctx = await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const type = request.nextUrl.searchParams.get('type')
  const categories = await prisma.category.findMany({
    where: { familyId: ctx.familyId, ...(type ? { type } : {}) },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  let ctx
  try {
    ctx = await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { name, type } = await request.json()
  if (!name || !name.trim() || (type !== 'recipe' && type !== 'tip')) {
    return NextResponse.json({ error: 'Ange namn och giltig typ' }, { status: 400 })
  }

  const existing = await prisma.category.findFirst({
    where: { familyId: ctx.familyId, name: name.trim(), type },
  })
  if (existing) {
    return NextResponse.json(existing, { status: 200 })
  }

  const category = await prisma.category.create({
    data: { name: name.trim(), type, familyId: ctx.familyId },
  })
  return NextResponse.json(category, { status: 201 })
}
