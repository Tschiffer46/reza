import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, userFamilyIds } from '@/lib/family'
import { snackCutoff } from '@/lib/snack'

/**
 * Olästa @-omnämnanden av mig (sedan jag senast öppnade Snack, inom TTL).
 * Returnerar totalsumman (`count`, för tab-brickan) samt en uppdelning per
 * gemenskap (`byFamily`) som native-appens gemenskapsväljare i Snack använder för
 * att visa en bricka per gemenskap. Ingen schemaändring — bara aggregering.
 */
export async function GET() {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ count: 0, byFamily: {} })
  }

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { snackSeenAt: true } })
  const cutoff = snackCutoff()
  const since = me?.snackSeenAt && me.snackSeenAt > cutoff ? me.snackSeenAt : cutoff
  const familyIds = await userFamilyIds(userId)

  // Gruppera omnämnanden per gemenskap. Svar (PostReply) ärver sin gemenskap från
  // moder-inlägget ⇒ vi summerar inläggens och svarens gemenskaper var för sig.
  const [postGroups, replyRows] = await Promise.all([
    prisma.post.groupBy({
      by: ['familyId'],
      where: { familyId: { in: familyIds }, mentions: { has: userId }, createdAt: { gt: since } },
      _count: { _all: true },
    }),
    prisma.postReply.findMany({
      where: { post: { familyId: { in: familyIds } }, mentions: { has: userId }, createdAt: { gt: since } },
      select: { post: { select: { familyId: true } } },
    }),
  ])

  const byFamily: Record<string, number> = {}
  for (const g of postGroups) byFamily[g.familyId] = (byFamily[g.familyId] ?? 0) + g._count._all
  for (const r of replyRows) byFamily[r.post.familyId] = (byFamily[r.post.familyId] ?? 0) + 1

  const count = Object.values(byFamily).reduce((n, c) => n + c, 0)
  return NextResponse.json({ count, byFamily })
}
