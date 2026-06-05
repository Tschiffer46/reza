import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, userFamilyIds } from '@/lib/family'

type Params = { params: Promise<{ id: string }> }

async function canAccess(entryId: string, userId: string) {
  const entry = await prisma.entry.findUnique({ where: { id: entryId } })
  if (!entry) return false
  const ids = await userFamilyIds(userId)
  return ids.includes(entry.familyId)
}

export async function POST(request: NextRequest, { params }: Params) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }
  const { id } = await params
  if (!(await canAccess(id, userId))) {
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
