'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EntryForm } from '@/components/EntryForm'
import { ImageUploader } from '@/components/ImageUploader'
import { ExtractPreview } from '@/components/ExtractPreview'

type Mode = 'choose' | 'text' | 'image' | 'url' | 'manual'
type ExtractedData = {
  type: string
  title: string
  category: string
  ingredients: string[]
  instructions: string | null
  content: string | null
  source: string | null
  url?: string | null
}

export default function NewEntryPage() {
  const [mode, setMode] = useState<Mode>('choose')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [imageFilenames, setImageFilenames] = useState<string[]>([])
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)

  async function handleExtractText() {
    if (!text.trim()) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (res.ok) {
        setExtracted(data)
      } else {
        setExtractError(data.error || 'Extraheringen misslyckades')
      }
    } catch {
      setExtractError('Nätverksfel')
    }
    setExtracting(false)
  }

  async function handleExtractImages() {
    if (imageFilenames.length === 0) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageFilenames }),
      })
      const data = await res.json()
      if (res.ok) {
        setExtracted(data)
      } else {
        setExtractError(data.error || 'Extraheringen misslyckades')
      }
    } catch {
      setExtractError('Nätverksfel')
    }
    setExtracting(false)
  }

  async function handleExtractUrl() {
    if (!url.trim()) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (res.ok) {
        setExtracted(data)
      } else {
        setExtractError(data.error || 'Extraheringen misslyckades')
      }
    } catch {
      setExtractError('Nätverksfel')
    }
    setExtracting(false)
  }

  function reset() {
    setMode('choose')
    setText('')
    setUrl('')
    setImageFilenames([])
    setExtracted(null)
    setExtractError('')
  }

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
          <h1 className="text-xl font-bold text-amber-800">Lägg till</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Show extraction result */}
        {extracted ? (
          <ExtractPreview
            data={extracted}
            imageFilenames={imageFilenames.length > 0 ? imageFilenames : undefined}
            onCancel={reset}
          />
        ) : mode === 'choose' ? (
          /* Mode selection */
          <div className="space-y-3">
            <p className="text-amber-700 text-sm mb-4">
              Hur vill du lägga till?
            </p>

            <button
              onClick={() => setMode('text')}
              className="w-full p-4 bg-white rounded-lg border border-amber-200 text-left hover:border-amber-400 transition-colors"
            >
              <div className="font-medium text-amber-800">📝 Klistra in text</div>
              <div className="text-sm text-amber-600 mt-1">Klistra in ett recept eller tips från en annan källa</div>
            </button>

            <button
              onClick={() => setMode('image')}
              className="w-full p-4 bg-white rounded-lg border border-amber-200 text-left hover:border-amber-400 transition-colors"
            >
              <div className="font-medium text-amber-800">📷 Ta foto / Ladda upp bild</div>
              <div className="text-sm text-amber-600 mt-1">Fotografera ett recept eller ladda upp en skärmdump</div>
            </button>

            <button
              onClick={() => setMode('url')}
              className="w-full p-4 bg-white rounded-lg border border-amber-200 text-left hover:border-amber-400 transition-colors"
            >
              <div className="font-medium text-amber-800">🔗 Ange URL</div>
              <div className="text-sm text-amber-600 mt-1">Hämta ett recept från en webbsida</div>
            </button>

            <button
              onClick={() => setMode('manual')}
              className="w-full p-4 bg-white rounded-lg border border-amber-200 text-left hover:border-amber-400 transition-colors"
            >
              <div className="font-medium text-amber-800">✏️ Skriv manuellt</div>
              <div className="text-sm text-amber-600 mt-1">Fyll i alla fält själv</div>
            </button>
          </div>
        ) : mode === 'text' ? (
          /* Text input */
          <div className="space-y-4">
            <button onClick={() => setMode('choose')} className="text-sm text-amber-600 hover:text-amber-800">
              ← Tillbaka
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={inputClass}
              rows={10}
              placeholder="Klistra in receptet eller tipset här..."
              autoFocus
            />
            {extractError && <p className="text-red-500 text-sm">{extractError}</p>}
            <button
              onClick={handleExtractText}
              disabled={extracting || !text.trim()}
              className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {extracting ? 'Analyserar med AI...' : 'Extrahera med AI'}
            </button>
          </div>
        ) : mode === 'image' ? (
          /* Image upload */
          <div className="space-y-4">
            <button onClick={() => setMode('choose')} className="text-sm text-amber-600 hover:text-amber-800">
              ← Tillbaka
            </button>
            <ImageUploader onUploaded={(fns) => setImageFilenames((prev) => [...prev, ...fns])} />
            {imageFilenames.length > 0 && (
              <p className="text-sm text-green-600">
                {imageFilenames.length} {imageFilenames.length === 1 ? 'bild' : 'bilder'} uppladdade
              </p>
            )}
            {extractError && <p className="text-red-500 text-sm">{extractError}</p>}
            <button
              onClick={handleExtractImages}
              disabled={extracting || imageFilenames.length === 0}
              className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {extracting ? 'Analyserar med AI...' : 'Extrahera med AI'}
            </button>
          </div>
        ) : mode === 'url' ? (
          /* URL input */
          <div className="space-y-4">
            <button onClick={() => setMode('choose')} className="text-sm text-amber-600 hover:text-amber-800">
              ← Tillbaka
            </button>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
              placeholder="https://recept.example.com/..."
              autoFocus
            />
            {extractError && <p className="text-red-500 text-sm">{extractError}</p>}
            <button
              onClick={handleExtractUrl}
              disabled={extracting || !url.trim()}
              className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {extracting ? 'Hämtar och analyserar...' : 'Hämta och extrahera'}
            </button>
          </div>
        ) : (
          /* Manual form */
          <div className="space-y-4">
            <button onClick={() => setMode('choose')} className="text-sm text-amber-600 hover:text-amber-800">
              ← Tillbaka
            </button>
            <EntryForm />
          </div>
        )}

        {/* Loading overlay */}
        {extracting && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="animate-spin w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full mx-auto mb-3" />
              <p className="text-amber-800 font-medium">AI analyserar...</p>
              <p className="text-amber-600 text-sm mt-1">Detta kan ta några sekunder</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
