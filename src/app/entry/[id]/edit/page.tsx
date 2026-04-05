import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EntryForm } from '@/components/EntryForm'

export const dynamic = 'force-dynamic'

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await prisma.entry.findUnique({ where: { id } })

  if (!entry) notFound()

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={`/entry/${id}`} className="text-amber-600 hover:text-amber-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-amber-800">Redigera</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <EntryForm initialData={JSON.parse(JSON.stringify(entry))} />
      </main>
    </div>
  )
}
