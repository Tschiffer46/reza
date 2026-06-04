import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireFamily } from '@/lib/family'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx
  try {
    ctx = await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.familyId !== ctx.familyId) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
