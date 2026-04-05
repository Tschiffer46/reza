import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  const where = type ? { type } : {}
  const categories = await prisma.category.findMany({ where, orderBy: { name: 'asc' } })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const { name, type } = await request.json()
  if (!name || !type) {
    return NextResponse.json({ error: 'Namn och typ krävs' }, { status: 400 })
  }
  const existing = await prisma.category.findUnique({ where: { name } })
  if (existing) {
    return NextResponse.json({ error: 'Kategorin finns redan' }, { status: 409 })
  }
  const category = await prisma.category.create({ data: { name, type } })
  return NextResponse.json(category, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID krävs' }, { status: 400 })
  }
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
