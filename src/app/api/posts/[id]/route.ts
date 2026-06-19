import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'

/** Ta bort ett inlägg (med svar). Tillåtet för författaren eller betalande medlem. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true, familyId: true } })
  if (!post) {
    return NextResponse.json({ error: 'Inlägget finns inte' }, { status: 404 })
  }

  if (post.authorId !== userId) {
    const [membership, me] = await Promise.all([
      prisma.membership.findUnique({ where: { userId_familyId: { userId, familyId: post.familyId } } }),
      prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    ])
    if (!membership || me?.plan !== 'paid') {
      return NextResponse.json({ error: 'Bara författaren eller en betalande medlem kan ta bort inlägget' }, { status: 403 })
    }
  }

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
