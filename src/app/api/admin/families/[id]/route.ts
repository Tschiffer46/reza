import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/family'

/** Admin: stäng (suspend) eller återöppna en gemenskap. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }
  const { id } = await params
  const { status } = await request.json()
  if (status !== 'active' && status !== 'suspended') {
    return NextResponse.json({ error: 'Ogiltig status' }, { status: 400 })
  }
  const family = await prisma.family.update({ where: { id }, data: { status } })
  return NextResponse.json({ id: family.id, status: family.status })
}
