import Link from 'next/link'
import { EntryForm } from '@/components/EntryForm'

export default function NewEntryPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-amber-600 hover:text-amber-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-amber-800">Lägg till</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <EntryForm />
      </main>
    </div>
  )
}
