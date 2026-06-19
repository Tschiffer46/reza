import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getDefaultFamily } from '@/lib/family'
import { displayName } from '@/lib/laga'
import { snackCutoff, timeAgo } from '@/lib/snack'
import { AppShell } from '@/components/laga/AppShell'
import { SnackBoard, type SnackPost } from '@/components/laga/SnackBoard'

export default async function SnackPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const userId = session.user.id
  const familyId = await getDefaultFamily(userId)
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  const canModerate = me?.plan === 'paid'

  const cutoff = snackCutoff()
  // Opportunistisk rensning av inlägg äldre än 7 dagar (ingen cron behövs).
  await prisma.post.deleteMany({ where: { createdAt: { lt: cutoff } } })

  const posts = await prisma.post.findMany({
    where: { familyId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true, email: true, avatar: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { name: true, email: true, avatar: true } } },
      },
    },
  })

  const data: SnackPost[] = posts.map((p) => ({
    id: p.id,
    author: displayName(p.author),
    avatar: p.author.avatar,
    text: p.text,
    when: timeAgo(p.createdAt),
    mine: p.authorId === userId,
    mentionsMe: p.mentions.includes(userId),
    replies: p.replies.map((r) => ({
      id: r.id,
      author: displayName(r.author),
      avatar: r.author.avatar,
      text: r.text,
      when: timeAgo(r.createdAt),
      mine: r.authorId === userId,
      mentionsMe: r.mentions.includes(userId),
    })),
  }))

  // Markera Snack som sett → nollställer olästa @-omnämnanden i menyn.
  await prisma.user.update({ where: { id: userId }, data: { snackSeenAt: new Date() } })

  return (
    <AppShell>
      <SnackBoard posts={data} canModerate={canModerate} />
    </AppShell>
  )
}
