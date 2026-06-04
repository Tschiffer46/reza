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
