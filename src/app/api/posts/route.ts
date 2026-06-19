import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, getDefaultFamily } from '@/lib/family'
import { displayName } from '@/lib/laga'
import { parseMentions } from '@/lib/snack'

/** Medlemmar i en gemenskap som {id, visningsnamn} — för @-omnämnanden. */
async function familyMembers(familyId: string): Promise<{ id: string; name: string }[]> {
  const members = await prisma.membership.findMany({
    where: { familyId },
    select: { user: { select: { id: true, name: true, email: true } } },
  })
  return members.map((m) => ({ id: m.user.id, name: displayName(m.user) }))
}

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

  const mentions = parseMentions(t, await familyMembers(familyId)).filter((id) => id !== userId)
  const post = await prisma.post.create({
    data: { familyId, authorId: userId, text: t.slice(0, 2000), mentions },
  })
  return NextResponse.json({ id: post.id }, { status: 201 })
}
