import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EntryActions } from '@/components/EntryActions'

export const dynamic = 'force-dynamic'

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await prisma.entry.findUnique({ where: { id } })

  if (!entry) notFound()

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-amber-600 hover:text-amber-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-amber-800 truncate">{entry.title}</h1>
          </div>
          <EntryActions entryId={entry.id} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700 font-medium">
            {entry.category}
          </span>
          {entry.type === 'tip' && (
            <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 font-medium">
              Tips
            </span>
          )}
          {entry.source && (
            <span className="text-sm text-gray-500">Källa: {entry.source}</span>
          )}
        </div>

        {/* Images */}
        {entry.imageUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {entry.imageUrls.map((img, i) => (
              <img
                key={i}
                src={`/api/images/${img}`}
                alt=""
                className="w-full max-w-sm rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {/* Recipe fields */}
        {entry.type === 'recipe' && (
          <>
            {entry.ingredients.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-amber-800 mb-2">Ingredienser</h2>
                <ul className="space-y-1">
                  {entry.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-amber-400 mt-1">•</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {entry.instructions && (
              <div>
                <h2 className="text-lg font-semibold text-amber-800 mb-2">Instruktioner</h2>
                <div className="text-gray-700 whitespace-pre-wrap">{entry.instructions}</div>
              </div>
            )}
          </>
        )}

        {/* Tip content */}
        {entry.type === 'tip' && entry.content && (
          <div>
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Innehåll</h2>
            <div className="text-gray-700 whitespace-pre-wrap">{entry.content}</div>
          </div>
        )}

        {/* Notes */}
        {entry.notes && (
          <div>
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Anteckningar</h2>
            <div className="text-gray-700 whitespace-pre-wrap bg-amber-50 rounded-lg p-4 border border-amber-100">
              {entry.notes}
            </div>
          </div>
        )}

        {/* URL */}
        {entry.url && (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Öppna källa
          </a>
        )}

        {/* Cook counter */}
        {entry.type === 'recipe' && (
          <CookSection entryId={entry.id} timesCooked={entry.timesCooked} lastCooked={entry.lastCooked} />
        )}

        {/* Timestamps */}
        <p className="text-xs text-gray-400">
          Tillagd {new Date(entry.createdAt).toLocaleDateString('sv-SE')}
        </p>
      </main>
    </div>
  )
}

function CookSection({ entryId, timesCooked, lastCooked }: { entryId: string; timesCooked: number; lastCooked: Date | null }) {
  return (
    <div className="bg-white rounded-lg border border-amber-100 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Lagad <span className="font-semibold text-amber-800">{timesCooked}</span>{' '}
            {timesCooked === 1 ? 'gång' : 'gånger'}
          </p>
          {lastCooked && (
            <p className="text-xs text-gray-400">
              Senast: {new Date(lastCooked).toLocaleDateString('sv-SE')}
            </p>
          )}
        </div>
        <CookButton entryId={entryId} />
      </div>
    </div>
  )
}

function CookButton({ entryId }: { entryId: string }) {
  return <CookButtonClient entryId={entryId} />
}

import { CookButtonClient } from '@/components/CookButton'
