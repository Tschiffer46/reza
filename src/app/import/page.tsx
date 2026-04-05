'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ExtractedEntry {
  type: string
  title: string
  category: string
  ingredients: string[]
  instructions: string | null
  content: string | null
  source: string | null
  selected?: boolean
}

export default function ImportPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [entries, setEntries] = useState<ExtractedEntry[]>([])
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedCount, setSavedCount] = useState(0)
  const [step, setStep] = useState<'input' | 'review' | 'done'>('input')

  async function handleExtract() {
    if (!text.trim()) return
    setExtracting(true)
    setError('')
    try {
      const res = await fetch('/api/extract/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (res.ok && data.entries) {
        setEntries(data.entries.map((e: ExtractedEntry) => ({ ...e, selected: true })))
        setStep('review')
      } else {
        setError(data.error || 'Extraheringen misslyckades')
      }
    } catch {
      setError('Natverksfel')
    }
    setExtracting(false)
  }

  function toggleEntry(index: number) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, selected: !e.selected } : e))
    )
  }

  async function handleSaveAll() {
    const toSave = entries.filter((e) => e.selected)
    if (toSave.length === 0) return
    setSaving(true)
    setError('')
    let count = 0

    for (const entry of toSave) {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entry.type === 'tip' ? 'tip' : 'recipe',
          title: entry.title,
          category: entry.category,
          ingredients: entry.ingredients || [],
          instructions: entry.instructions || null,
          content: entry.content || null,
          source: entry.source || null,
          url: null,
          notes: null,
          imageUrls: [],
        }),
      })
      if (res.ok) count++
    }

    setSavedCount(count)
    setSaving(false)
    setStep('done')
  }

  const selectedCount = entries.filter((e) => e.selected).length

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800'

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-amber-600 hover:text-amber-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-amber-800">Importera flera</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === 'input' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm">
                Klistra in text med flera recept och/eller tips. AI:n delar upp dem automatiskt.
              </p>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={inputClass}
              rows={15}
              placeholder={"Klistra in dina anteckningar har...\n\nExempel:\n\nPasta Carbonara\n2 dl gradde, 200g pasta...\n\n---\n\nBasta sattet att forvara basilika\nStall i ett glas vatten..."}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleExtract}
              disabled={extracting || !text.trim()}
              className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {extracting ? 'AI analyserar...' : 'Analysera med AI'}
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm font-medium">
                AI hittade {entries.length} recept/tips. Avmarkera de du inte vill spara.
              </p>
            </div>

            {entries.map((entry, i) => (
              <div
                key={i}
                onClick={() => toggleEntry(i)}
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-colors ${
                  entry.selected
                    ? 'border-amber-400 bg-amber-50/50'
                    : 'border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 mt-0.5 rounded flex-shrink-0 border-2 flex items-center justify-center ${
                    entry.selected ? 'border-amber-600 bg-amber-600' : 'border-gray-300'
                  }`}>
                    {entry.selected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-amber-800">{entry.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {entry.type === 'recipe' ? 'Recept' : 'Tips'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {entry.category}
                      </span>
                    </div>
                    {entry.type === 'recipe' && entry.ingredients.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {entry.ingredients.slice(0, 3).join(', ')}
                        {entry.ingredients.length > 3 && ` +${entry.ingredients.length - 3} till`}
                      </p>
                    )}
                    {entry.type === 'tip' && entry.content && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{entry.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setStep('input')}
                className="flex-1 py-3 border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors"
              >
                Tillbaka
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving || selectedCount === 0}
                className="flex-1 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Sparar...' : `Spara ${selectedCount} st`}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-amber-800 mb-2">
              {savedCount} recept/tips sparade!
            </h2>
            <div className="flex gap-2 justify-center mt-6">
              <button
                onClick={() => {
                  setText('')
                  setEntries([])
                  setStep('input')
                }}
                className="px-6 py-3 border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors"
              >
                Importera fler
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                Till startsidan
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {(extracting || saving) && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="animate-spin w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full mx-auto mb-3" />
              <p className="text-amber-800 font-medium">
                {extracting ? 'AI analyserar texten...' : 'Sparar recept...'}
              </p>
              <p className="text-amber-600 text-sm mt-1">Detta kan ta en stund</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
