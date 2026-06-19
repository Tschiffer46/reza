import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, getDefaultFamily } from '@/lib/family'

/** Skapa ett snack-inlägg i användarens standardgemenskap. */
export async function POST(request: NextRequest) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const familyId = await getDefaultFamily(userId)
  const { text } = await request.json()
  const t = String(text || '').trim()
  if (!t) {
    return NextResponse.json({ error: 'Skriv något' }, { status: 400 })
  }

  const post = await prisma.post.create({
    data: { familyId, authorId: userId, text: t.slice(0, 2000) },
  })
  return NextResponse.json({ id: post.id }, { status: 201 })
}
