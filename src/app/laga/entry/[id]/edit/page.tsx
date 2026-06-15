import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { userFamilyIds } from '@/lib/family'
import { AppShell } from '@/components/laga/AppShell'
import { EntryForm } from '@/components/EntryForm'
import { DeleteEntryButton } from '@/components/laga/DeleteEntryButton'

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const userId = session.user.id
  const { id } = await params

  const entry = await prisma.entry.findUnique({ where: { id } })
  const familyIds = await userFamilyIds(userId)
  if (!entry || !familyIds.includes(entry.familyId)) {
    notFound()
  }

  // Skapare får alltid radera egna; annars krävs betald + gemenskaps-admin, eller global admin.
  const [me, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, isAdmin: true } }),
    prisma.membership.findUnique({ where: { userId_familyId: { userId, familyId: entry.familyId } } }),
  ])
  const canDelete =
    entry.creatorId === userId || (me?.plan === 'paid' && membership?.role === 'admin') || !!me?.isAdmin

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link href={`/laga/entry/${entry.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          ← Tillbaka
        </Link>
        <h1 className="mb-4 text-xl font-semibold text-brand-header">Redigera</h1>
        <EntryForm
          initialData={{
            id: entry.id,
            type: entry.type,
            title: entry.title,
            category: entry.category,
            blurb: entry.blurb,
            time: entry.time,
            servings: entry.servings,
            ingredients: entry.ingredients,
            instructions: entry.instructions,
            content: entry.content,
            drinks: entry.drinks,
            source: entry.source,
            url: entry.url,
            imageUrls: entry.imageUrls,
            familyId: entry.familyId,
          }}
        />
        {canDelete && <DeleteEntryButton entryId={entry.id} />}
      </div>
    </AppShell>
  )
}
