import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, userFamilyIds } from '@/lib/family'
import { snackCutoff } from '@/lib/snack'

/** Antal olästa @-omnämnanden av mig (sedan jag senast öppnade Snack, inom TTL). */
export async function GET() {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ count: 0 })
  }

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { snackSeenAt: true } })
  const cutoff = snackCutoff()
  const since = me?.snackSeenAt && me.snackSeenAt > cutoff ? me.snackSeenAt : cutoff
  const familyIds = await userFamilyIds(userId)

  const [posts, replies] = await Promise.all([
    prisma.post.count({ where: { familyId: { in: familyIds }, mentions: { has: userId }, createdAt: { gt: since } } }),
    prisma.postReply.count({ where: { post: { familyId: { in: familyIds } }, mentions: { has: userId }, createdAt: { gt: since } } }),
  ])

  return NextResponse.json({ count: posts + replies })
}
