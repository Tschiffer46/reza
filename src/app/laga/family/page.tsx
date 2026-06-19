import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getDefaultFamily, getUserFamilies } from '@/lib/family'
import { displayName } from '@/lib/laga'
import { AppShell } from '@/components/laga/AppShell'
import { FamilyView, type FamilyViewData } from '@/components/laga/FamilyView'

function rel(d: Date): string {
  const diff = Date.now() - d.getTime()
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return 'idag'
  if (diff < 2 * day) return 'igår'
  if (diff < 7 * day) return `${Math.floor(diff / day)} dagar sedan`
  return d.toLocaleDateString('sv-SE')
}

const VERB: Record<string, string> = { created: 'lade till', cooked: 'lagade', updated: 'ändrade' }

export default async function FamilyPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const userId = session.user.id
  const familyId = await getDefaultFamily(userId)
  const families = await getUserFamilies(userId)
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  const canEditCover = me?.plan === 'paid'

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { joinedAt: 'asc' } } },
  })
  if (!family) redirect('/laga')

  const entries = await prisma.entry.findMany({
    where: { familyId },
    select: { id: true, title: true, imageUrls: true, creatorId: true },
  })
  const entryMap = new Map(entries.map((e) => [e.id, e]))

  const [changes, comments] = await Promise.all([
    prisma.changeLog.findMany({
      where: { entry: { familyId } },
      select: { action: true, userId: true, createdAt: true, entryId: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.comment.findMany({
      where: { entry: { familyId } },
      select: { authorId: true, createdAt: true, entryId: true, author: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 40,
    }),
  ])

  const cookedTotal = changes.filter((c) => c.action === 'cooked').length

  const members = family.members.map((m) => ({
    name: displayName(m.user),
    role: m.role,
    added: entries.filter((e) => e.creatorId === m.user.id).length,
    cooked: changes.filter((c) => c.action === 'cooked' && c.userId === m.user.id).length,
  }))

  type Item = { ts: number; actor: string; verb: string; entryId: string; title: string; img: string | null; when: string }
  const activity: Item[] = [
    ...changes
      .filter((c) => c.action !== 'updated')
      .map((c): Item | null => {
        const e = entryMap.get(c.entryId)
        return e ? { ts: c.createdAt.getTime(), actor: displayName(c.user), verb: VERB[c.action] || c.action, entryId: e.id, title: e.title, img: e.imageUrls[0] || null, when: rel(c.createdAt) } : null
      })
      .filter((x): x is Item => !!x),
    ...comments
      .map((c): Item | null => {
        const e = entryMap.get(c.entryId)
        return e ? { ts: c.createdAt.getTime(), actor: displayName(c.author), verb: 'kommenterade', entryId: e.id, title: e.title, img: e.imageUrls[0] || null, when: rel(c.createdAt) } : null
      })
      .filter((x): x is Item => !!x),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 12)

  const data: FamilyViewData = {
    id: family.id,
    name: family.name,
    inviteCode: family.inviteCode,
    background: family.background,
    coverImage: family.coverImage,
    stats: { recipes: entries.length, cooked: cookedTotal, cooks: members.length },
    members,
    activity: activity.map(({ actor, verb, entryId, title, img, when }) => ({ actor, verb, entryId, title, img, when })),
    families: families.map((f) => ({ id: f.id, name: f.name })),
    canEditCover,
  }

  return (
    <AppShell>
      <FamilyView data={data} />
    </AppShell>
  )
}
