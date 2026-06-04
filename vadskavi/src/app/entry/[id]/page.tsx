import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getActiveFamily } from '@/lib/family'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { CookButton } from '@/components/CookButton'
import { EntryActions } from '@/components/EntryActions'
import { CommentSection } from '@/components/CommentSection'
import { Button } from '@/components/ui/button'
import type { CommentDTO } from '@/lib/types'

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const familyId = await getActiveFamily(session.user.id)
  const { id } = await params

  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true, email: true } },
      comments: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!entry || entry.familyId !== familyId) {
    notFound()
  }

  const comments: CommentDTO[] = entry.comments.map((c) => ({
    id: c.id,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
    author: c.author,
  }))

  return (
    <div className="min-h-screen pb-20">
      <Header>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Tillbaka
          </Button>
        </Link>
      </Header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-xs text-brand-accent-dark">
              {entry.category}
            </span>
            <span className="text-xs text-brand-muted">{entry.type === 'tip' ? 'Tips' : 'Recept'}</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-header">{entry.title}</h1>
          <p className="text-sm text-brand-muted">
            Tillagad {entry.timesCooked} {entry.timesCooked === 1 ? 'gång' : 'gånger'}
            {entry.lastCooked && ` · senast ${entry.lastCooked.toLocaleDateString('sv-SE')}`}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <CookButton entryId={entry.id} />
          <EntryActions entryId={entry.id} />
        </div>

        {entry.type === 'recipe' && entry.ingredients.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-brand-header">Ingredienser</h2>
            <ul className="list-inside list-disc space-y-1 text-brand-ink">
              {entry.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </section>
        )}

        {entry.instructions && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-brand-header">Instruktioner</h2>
            <p className="whitespace-pre-wrap text-brand-ink">{entry.instructions}</p>
          </section>
        )}

        {entry.content && (
          <section className="space-y-2">
            <p className="whitespace-pre-wrap text-brand-ink">{entry.content}</p>
          </section>
        )}

        {entry.drinks && (
          <section className="space-y-1">
            <h2 className="text-lg font-semibold text-brand-header">Dryck</h2>
            <p className="text-brand-ink">{entry.drinks}</p>
          </section>
        )}

        {(entry.source || entry.url) && (
          <section className="space-y-1 text-sm text-brand-muted">
            {entry.source && <p>Källa: {entry.source}</p>}
            {entry.url && (
              <p>
                <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-brand-accent-dark underline">
                  {entry.url}
                </a>
              </p>
            )}
          </section>
        )}

        <CommentSection entryId={entry.id} initialComments={comments} />
      </main>

      <NavBar />
    </div>
  )
}
