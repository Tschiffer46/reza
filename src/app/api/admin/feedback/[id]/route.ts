import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/family'

/** Admin: markera feedback som hanterad/ny. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }
  const { id } = await params
  const { status } = await request.json()
  if (status !== 'new' && status !== 'handled') {
    return NextResponse.json({ error: 'Ogiltig status' }, { status: 400 })
  }
  const fb = await prisma.feedback.update({ where: { id }, data: { status }, select: { id: true, status: true } })
  return NextResponse.json(fb)
}

/** Admin: ta bort feedback. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }
  const { id } = await params
  await prisma.feedback.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
