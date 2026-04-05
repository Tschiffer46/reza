import Link from 'next/link'
import { prisma } from '@/lib/db'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const entryCount = await prisma.entry.count()

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-800">Reza</h1>
          <LogoutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {entryCount === 0 ? (
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
          <div>
            <p className="text-amber-700 mb-4">
              {entryCount} {entryCount === 1 ? 'post' : 'poster'} sparade
            </p>
            {/* Entry list will be built in Sprint 2 */}
          </div>
        )}
      </main>

      {/* Floating add button */}
      <Link
        href="/entry/new"
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-600 text-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-amber-700 transition-colors"
      >
        +
      </Link>
    </div>
  )
}
