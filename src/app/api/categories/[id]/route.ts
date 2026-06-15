import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, userFamilyIds } from '@/lib/family'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const category = await prisma.category.findUnique({ where: { id } })
  const familyIds = await userFamilyIds(userId)
  if (!category || !familyIds.includes(category.familyId)) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
