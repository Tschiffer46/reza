import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getActiveFamily } from '@/lib/family'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { EntryForm } from '@/components/EntryForm'
import { Button } from '@/components/ui/button'

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const familyId = await getActiveFamily(session.user.id)
  const { id } = await params

  const entry = await prisma.entry.findUnique({ where: { id } })
  if (!entry || entry.familyId !== familyId) {
    notFound()
  }

  return (
    <div className="min-h-screen pb-20">
      <Header>
        <Link href={`/entry/${entry.id}`}>
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Tillbaka
          </Button>
        </Link>
      </Header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold text-brand-header">Redigera</h1>
        <EntryForm
          initialData={{
            id: entry.id,
            type: entry.type,
            title: entry.title,
            category: entry.category,
            ingredients: entry.ingredients,
            instructions: entry.instructions,
            content: entry.content,
            drinks: entry.drinks,
            source: entry.source,
            url: entry.url,
            imageUrls: entry.imageUrls,
          }}
        />
      </main>
      <NavBar />
    </div>
  )
}
