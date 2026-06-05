'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ExtractedEntry } from '@/lib/ai'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { Button } from '@/components/ui/button'

export default function ImportPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [entries, setEntries] = useState<ExtractedEntry[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  async function extract() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/extract/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (res.ok) {
        setEntries(data.entries)
        setSelected(new Set(data.entries.map((_: ExtractedEntry, i: number) => i)))
      } else {
        setError(data.error || 'Extraheringen misslyckades')
      }
    } catch {
      setError('Något gick fel')
    }
    setLoading(false)
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  async function saveSelected() {
    if (!entries) return
    setSaving(true)
    setError('')
    for (const i of selected) {
      const e = entries[i]
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...e, imageUrls: [] }),
      })
    }
    router.push('/laga')
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-20">
      <Header>
        <Link href="/laga">
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Tillbaka
          </Button>
        </Link>
      </Header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <h1 className="text-xl font-semibold text-brand-header">Importera flera recept</h1>

        {!entries && (
          <div className="space-y-3">
            <p className="text-sm text-brand-muted">
              Klistra in text med ett eller flera recept/tips — AI delar upp och extraherar dem.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="Klistra in recepttext här…"
              className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <Button onClick={extract} disabled={loading || !text.trim()} className="w-full">
              {loading ? 'AI arbetar…' : 'Extrahera'}
            </Button>
          </div>
        )}

        {entries && (
          <div className="space-y-3">
            <p className="text-sm text-brand-muted">
              {entries.length} hittade — välj vilka du vill spara.
            </p>
            <ul className="space-y-2">
              {entries.map((e, i) => (
                <li key={i}>
                  <label className="flex items-start gap-3 rounded-xl border border-brand-accent/20 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                      className="mt-1 h-4 w-4 accent-brand-accent"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-brand-header">{e.title}</span>
                      <span className="block text-xs text-brand-muted">
                        {e.type === 'tip' ? 'Tips' : 'Recept'} · {e.category}
                        {e.ingredients.length > 0 && ` · ${e.ingredients.length} ingredienser`}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button onClick={saveSelected} disabled={saving || selected.size === 0} className="flex-1">
                {saving ? 'Sparar…' : `Spara ${selected.size} valda`}
              </Button>
              <Button variant="ghost" onClick={() => setEntries(null)}>
                Börja om
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>

      <NavBar />
    </div>
  )
}
