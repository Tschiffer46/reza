import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'

/** Ta bort ett svar. Tillåtet för författaren eller betalande medlem. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> },
) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id, replyId } = await params
  const reply = await prisma.postReply.findUnique({
    where: { id: replyId },
    select: { authorId: true, postId: true, post: { select: { familyId: true } } },
  })
  if (!reply || reply.postId !== id) {
    return NextResponse.json({ error: 'Svaret finns inte' }, { status: 404 })
  }

  if (reply.authorId !== userId) {
    const [membership, me] = await Promise.all([
      prisma.membership.findUnique({ where: { userId_familyId: { userId, familyId: reply.post.familyId } } }),
      prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    ])
    if (!membership || me?.plan !== 'paid') {
      return NextResponse.json({ error: 'Bara författaren eller en betalande medlem kan ta bort svaret' }, { status: 403 })
    }
  }

  await prisma.postReply.delete({ where: { id: replyId } })
  return NextResponse.json({ ok: true })
}
