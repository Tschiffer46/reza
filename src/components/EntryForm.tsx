'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EntryFormProps {
  initialData?: {
    id?: string
    type: string
    title: string
    category: string
    ingredients: string[]
    instructions: string | null
    content: string | null
    source: string | null
    url: string | null
    notes: string | null
  }
  onSaved?: () => void
}

interface Category {
  id: string
  name: string
  type: string
}

export function EntryForm({ initialData, onSaved }: EntryFormProps) {
  const router = useRouter()
  const [type, setType] = useState(initialData?.type || 'recipe')
  const [title, setTitle] = useState(initialData?.title || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [ingredients, setIngredients] = useState(initialData?.ingredients?.join('\n') || '')
  const [instructions, setInstructions] = useState(initialData?.instructions || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [source, setSource] = useState(initialData?.source || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/categories?type=${type}`)
      .then((r) => r.json())
      .then(setCategories)
  }, [type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const data = {
      type,
      title,
      category,
      ingredients: type === 'recipe' ? ingredients.split('\n').filter((i) => i.trim()) : [],
      instructions: type === 'recipe' ? instructions || null : null,
      content: type === 'tip' ? content || null : null,
      source: source || null,
      url: url || null,
      notes: notes || null,
    }

    const isEdit = !!initialData?.id
    const fetchUrl = isEdit ? `/api/entries/${initialData.id}` : '/api/entries'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(fetchUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const entry = await res.json()
      if (onSaved) {
        onSaved()
      } else {
        router.push(`/entry/${entry.id}`)
        router.refresh()
      }
    } else {
      const err = await res.json()
      setError(err.error || 'Något gick fel')
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('recipe')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            type === 'recipe'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          Recept
        </button>
        <button
          type="button"
          onClick={() => setType('tip')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            type === 'tip'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          Tips
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-amber-800 mb-1">Titel *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          required
          placeholder="T.ex. Pasta Carbonara"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-amber-800 mb-1">Kategori *</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
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

      {/* Recipe-specific fields */}
      {type === 'recipe' && (
        <>
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">
              Ingredienser (en per rad)
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className={inputClass}
              rows={6}
              placeholder="2 dl grädde&#10;200g pasta&#10;100g guanciale"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">Instruktioner</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={inputClass}
              rows={6}
              placeholder="Steg-för-steg..."
            />
          </div>
        </>
      )}

      {/* Tip-specific field */}
      {type === 'tip' && (
        <div>
          <label className="block text-sm font-medium text-amber-800 mb-1">Innehåll</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={inputClass}
            rows={6}
            placeholder="Skriv ditt tips här..."
          />
        </div>
      )}

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-amber-800 mb-1">Källa</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={inputClass}
          placeholder="T.ex. Leila Lindholms kokbok"
        />
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-amber-800 mb-1">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={inputClass}
          placeholder="https://..."
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-amber-800 mb-1">Anteckningar</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          rows={3}
          placeholder="Egna anteckningar..."
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Sparar...' : initialData?.id ? 'Uppdatera' : 'Spara'}
      </button>
    </form>
  )
}
