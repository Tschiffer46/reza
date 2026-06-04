'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CategoryDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'

export interface EntryFormData {
  id?: string
  type: string
  title: string
  category: string
  ingredients: string[]
  instructions: string | null
  content: string | null
  drinks: string | null
  source: string | null
  url: string | null
}

const inputClass =
  'w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent'

export function EntryForm({ initialData }: { initialData?: Partial<EntryFormData> }) {
  const router = useRouter()
  const [type, setType] = useState(initialData?.type || 'recipe')
  const [title, setTitle] = useState(initialData?.title || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [ingredients, setIngredients] = useState((initialData?.ingredients || []).join('\n'))
  const [instructions, setInstructions] = useState(initialData?.instructions || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [drinks, setDrinks] = useState(initialData?.drinks || '')
  const [source, setSource] = useState(initialData?.source || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/categories?type=${type}`)
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]))
  }, [type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const data = {
      type,
      title,
      category,
      ingredients:
        type === 'recipe' ? ingredients.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      instructions: type === 'recipe' ? instructions || null : null,
      content: type === 'tip' ? content || null : null,
      drinks: drinks || null,
      source: source || null,
      url: url || null,
    }

    const isEdit = !!initialData?.id
    const res = await fetch(isEdit ? `/api/entries/${initialData.id}` : '/api/entries', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const entry = await res.json()
      router.push(`/entry/${entry.id}`)
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'Kunde inte spara')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Typväljare */}
      <div className="flex gap-2">
        {(['recipe', 'tip'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
              type === t
                ? 'bg-brand-accent text-white'
                : 'bg-brand-accent/10 text-brand-accent-dark hover:bg-brand-accent/20'
            }`}
          >
            {t === 'recipe' ? 'Recept' : 'Tips'}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-brand-header">Titel</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'recipe' ? 'T.ex. Pasta Carbonara' : 'T.ex. Förvara basilika'}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-brand-header">Kategori</label>
        <select
          className={inputClass}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Välj kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {type === 'recipe' && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-header">Ingredienser (en per rad)</label>
            <textarea
              className={inputClass}
              rows={6}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder={'2 dl grädde\n200 g pasta\n…'}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-header">Instruktioner</label>
            <textarea
              className={inputClass}
              rows={6}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Steg för steg…"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-header">Dryck som passar (valfritt)</label>
            <input
              className={inputClass}
              value={drinks}
              onChange={(e) => setDrinks(e.target.value)}
              placeholder="T.ex. ett friskt vitt vin"
            />
          </div>
        </>
      )}

      {type === 'tip' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-header">Innehåll</label>
          <textarea
            className={inputClass}
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Skriv ditt tips här…"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-brand-header">Källa (valfritt)</label>
        <input
          className={inputClass}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="T.ex. Leila Lindholms kokbok"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-brand-header">Länk (valfritt)</label>
        <input
          className={inputClass}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={saving}>
        {saving ? 'Sparar…' : initialData?.id ? 'Uppdatera' : 'Spara'}
      </Button>
    </form>
  )
}
