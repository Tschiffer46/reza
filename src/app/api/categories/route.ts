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
  const category = await prisma.category.create({ data: { name, type } })
  return NextResponse.json(category, { status: 201 })
}
