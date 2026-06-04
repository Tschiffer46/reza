import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/db'
import { getActiveFamily } from '@/lib/family'
import { searchEntries } from '@/lib/search'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { EntryList } from '@/components/EntryList'
import { Button } from '@/components/ui/button'
import type { CategoryDTO, EntryDTO } from '@/lib/types'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const familyId = await getActiveFamily(session.user.id)

  const [rawEntries, rawCategories] = await Promise.all([
    searchEntries({ familyId }),
    prisma.category.findMany({ where: { familyId }, orderBy: { name: 'asc' } }),
  ])

  const entries: EntryDTO[] = rawEntries.map((e) => ({
    id: e.id,
    type: e.type,
    title: e.title,
    category: e.category,
    ingredients: e.ingredients,
    instructions: e.instructions,
    content: e.content,
    drinks: e.drinks,
    source: e.source,
    url: e.url,
    timesCooked: e.timesCooked,
    lastCooked: e.lastCooked ? e.lastCooked.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  }))
  const categories: CategoryDTO[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }))

  async function logout() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-screen pb-20">
      <Header>
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-white/60 text-white hover:bg-white/10"
          >
            Logga ut
          </Button>
        </form>
      </Header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <EntryList initialEntries={entries} categories={categories} />
      </main>
      <NavBar />
    </div>
  )
}
