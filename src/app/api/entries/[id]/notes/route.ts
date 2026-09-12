import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'
import { findVisibleEntry } from '@/lib/entry-access'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }
  const { id } = await params
  if (!(await findVisibleEntry(id, userId))) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }
  const { text } = await request.json()
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Tom notering' }, { status: 400 })
  }
  const note = await prisma.note.create({
    data: { text: text.trim(), entryId: id, authorId: userId },
    include: { author: { select: { name: true, email: true } } },
  })
  return NextResponse.json(note, { status: 201 })
}
