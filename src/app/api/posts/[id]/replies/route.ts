import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, assertMember } from '@/lib/family'

/** Svara på ett inlägg. Alla medlemmar i gemenskapen får svara. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, select: { familyId: true } })
  if (!post) {
    return NextResponse.json({ error: 'Inlägget finns inte' }, { status: 404 })
  }
  try {
    await assertMember(userId, post.familyId)
  } catch {
    return NextResponse.json({ error: 'Du tillhör inte den gemenskapen' }, { status: 403 })
  }

  const { text } = await request.json()
  const t = String(text || '').trim()
  if (!t) {
    return NextResponse.json({ error: 'Skriv något' }, { status: 400 })
  }

  const reply = await prisma.postReply.create({
    data: { postId: id, authorId: userId, text: t.slice(0, 2000) },
  })
  return NextResponse.json({ id: reply.id }, { status: 201 })
}
