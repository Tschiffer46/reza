import Link from 'next/link'
import { prisma } from '@/lib/db'
import { LogoutButton } from '@/components/LogoutButton'
import { EntryList } from '@/components/EntryList'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [entriesData, categories] = await Promise.all([
    prisma.entry.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  const total = await prisma.entry.count()
  const categoryNames = [...new Set(categories.map((c) => c.name))]

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-800">Reza</h1>
          <LogoutButton />
        </div>
      </header>

      {/* Quick links */}
      <div className="max-w-2xl mx-auto px-4 pt-4 flex gap-2">
        <Link
          href="/entry/new"
          className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium text-center hover:bg-amber-700 transition-colors"
        >
          + Lägg till
        </Link>
        <Link
          href="/import"
          className="flex-1 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium text-center hover:bg-amber-200 transition-colors"
        >
          Importera flera
        </Link>
        <Link
          href="/categories"
          className="flex-1 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium text-center hover:bg-amber-200 transition-colors"
        >
          Kategorier
        </Link>
      </div>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {total === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍳</div>
            <h2 className="text-xl font-semibold text-amber-800 mb-2">
              Inga recept ännu
            </h2>
            <p className="text-amber-600 mb-6">
              Börja samla dina favoritrecept och mattips!
            </p>
            <Link
              href="/entry/new"
              className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              + Lägg till ditt första recept
            </Link>
          </div>
        ) : (
          <EntryList
            initialEntries={JSON.parse(JSON.stringify(entriesData))}
            initialTotal={total}
            categories={categoryNames}
          />
        )}
      </main>

    </div>
  )
}
