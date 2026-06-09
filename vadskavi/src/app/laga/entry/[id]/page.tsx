import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { userFamilyIds } from '@/lib/family'
import { aggregateCooked, displayName } from '@/lib/laga'
import { AppShell } from '@/components/laga/AppShell'
import { RecipeView, type RecipeDTO } from '@/components/laga/RecipeView'

function relativeDate(d: Date): string {
  const diff = Date.now() - d.getTime()
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return 'idag'
  if (diff < 2 * day) return 'igår'
  if (diff < 7 * day) return `för ${Math.floor(diff / day)} dagar sedan`
  return d.toLocaleDateString('sv-SE')
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const userId = session.user.id
  const { id } = await params

  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      family: { select: { id: true, name: true } },
      comments: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' } },
      notes: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' } },
      changes: { where: { action: 'cooked' }, select: { action: true, user: { select: { name: true, email: true } } } },
      reactions: { select: { userId: true } },
    },
  })

  const ids = await userFamilyIds(userId)
  if (!entry || !ids.includes(entry.familyId)) {
    notFound()
  }

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
  const meName = displayName(me)

  const recipe: RecipeDTO = {
    id: entry.id,
    type: entry.type,
    title: entry.title,
    category: entry.category,
    blurb: entry.blurb,
    time: entry.time,
    servings: entry.servings,
    ingredients: entry.type === 'tip' ? [] : entry.ingredients,
    steps: entry.type === 'tip' ? [] : (entry.instructions || '').split('\n').map((s) => s.trim()).filter(Boolean),
    content: entry.type === 'tip' ? entry.content : null,
    drinks: entry.drinks,
    source: entry.source,
    url: entry.url,
    imageUrls: entry.imageUrls,
    family: entry.family ? { id: entry.family.id, name: entry.family.name } : undefined,
    cookedBy: aggregateCooked(entry.changes),
    hearted: entry.reactions.some((r) => r.userId === userId),
    heartCount: entry.reactions.length,
    notes: entry.notes.map((n) => ({ id: n.id, text: n.text, author: displayName(n.author), date: relativeDate(n.createdAt) })),
    comments: entry.comments.map((c) => ({ id: c.id, text: c.text, author: displayName(c.author), date: relativeDate(c.createdAt) })),
  }

  return (
    <AppShell>
      <RecipeView recipe={recipe} meName={meName} />
    </AppShell>
  )
}
