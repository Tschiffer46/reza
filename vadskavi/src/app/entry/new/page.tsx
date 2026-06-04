'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Camera, PencilLine, Link2 } from 'lucide-react'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { EntryForm, type EntryFormData } from '@/components/EntryForm'
import { ImageUploader } from '@/components/ImageUploader'
import { Button } from '@/components/ui/button'

type Mode = 'choose' | 'text' | 'image' | 'url' | 'form'

export default function NewEntryPage() {
  const [mode, setMode] = useState<Mode>('choose')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState<Partial<EntryFormData> | undefined>()

  async function runExtract(send: () => Promise<Response>) {
    setLoading(true)
    setError('')
    try {
      const res = await send()
      if (res.ok) {
        setExtracted(await res.json())
        setMode('form')
      } else {
        const e = await res.json().catch(() => ({}))
        setError(e.error || 'Extraheringen misslyckades')
      }
    } catch {
      setError('Något gick fel')
    }
    setLoading(false)
  }

  const extractText = () =>
    runExtract(() =>
      fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }),
    )

  const extractImage = () => {
    if (files.length === 0) return
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    return runExtract(() => fetch('/api/extract', { method: 'POST', body: fd }))
  }

  const extractUrl = () =>
    runExtract(() =>
      fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }),
    )

  return (
    <div className="min-h-screen pb-20">
      <Header>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Tillbaka
          </Button>
        </Link>
      </Header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {mode === 'choose' && (
          <div className="space-y-3">
            <h1 className="text-xl font-semibold text-brand-header">Lägg till recept eller tips</h1>
            <ChooseButton icon={FileText} title="Klistra in text" desc="AI extraherar receptet" onClick={() => setMode('text')} />
            <ChooseButton icon={Camera} title="Ta foto / välj bild" desc="AI läser av bilden" onClick={() => setMode('image')} />
            <ChooseButton icon={Link2} title="Klistra in länk" desc="AI hämtar receptet från sidan" onClick={() => setMode('url')} />
            <ChooseButton icon={PencilLine} title="Fyll i manuellt" desc="Skriv in själv" onClick={() => { setExtracted(undefined); setMode('form') }} />
            <Link href="/import" className="block text-center text-sm text-brand-accent-dark underline">
              Importera flera recept på en gång
            </Link>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Klistra in ett recept eller tips här…"
              className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <div className="flex gap-2">
              <Button onClick={extractText} disabled={loading || !text.trim()} className="flex-1">
                {loading ? 'AI arbetar…' : 'Extrahera med AI'}
              </Button>
              <Button variant="ghost" onClick={() => setMode('choose')}>Avbryt</Button>
            </div>
          </div>
        )}

        {mode === 'image' && (
          <div className="space-y-3">
            <ImageUploader onSelected={setFiles} />
            <div className="flex gap-2">
              <Button onClick={extractImage} disabled={loading || files.length === 0} className="flex-1">
                {loading ? 'AI arbetar…' : 'Extrahera med AI'}
              </Button>
              <Button variant="ghost" onClick={() => setMode('choose')}>Avbryt</Button>
            </div>
          </div>
        )}

        {mode === 'url' && (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exempel.se/recept"
              className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <div className="flex gap-2">
              <Button onClick={extractUrl} disabled={loading || !url.trim()} className="flex-1">
                {loading ? 'Hämtar…' : 'Hämta recept'}
              </Button>
              <Button variant="ghost" onClick={() => setMode('choose')}>Avbryt</Button>
            </div>
          </div>
        )}

        {mode === 'form' && (
          <div className="space-y-3">
            {extracted && (
              <div className="rounded-lg bg-brand-accent/10 p-3 text-sm text-brand-accent-dark">
                AI har fyllt i fälten — granska och justera innan du sparar.
              </div>
            )}
            <EntryForm initialData={extracted} />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>

      <NavBar />
    </div>
  )
}

function ChooseButton({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 text-left hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent-dark">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-medium text-brand-header">{title}</span>
        <span className="block text-sm text-brand-muted">{desc}</span>
      </span>
    </button>
  )
}
