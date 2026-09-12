'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CategoryDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { PhotoUploader } from '@/components/PhotoUploader'

export interface EntryFormData {
  id?: string
  type: string
  title: string
  category: string
  blurb?: string | null
  time?: string | null
  servings?: number | null
  ingredients: string[]
  instructions: string | null
  content: string | null
  drinks: string | null
  source: string | null
  url: string | null
  imageUrls: string[]
  /** Primär-/ursprungsgemenskap (bakåtkompatibel enkelform). */
  familyId?: string
  /** Alla gemenskaper receptet ska synas i. Tom när det är privat. */
  familyIds?: string[]
  /** "private" = bara jag, "family" = gemenskaperna i familyIds. */
  visibility?: 'family' | 'private'
}

const inputClass =
  'w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent'

export function EntryForm({ initialData }: { initialData?: Partial<EntryFormData> }) {
  const router = useRouter()
  const [type, setType] = useState(initialData?.type || 'recipe')
  const [title, setTitle] = useState(initialData?.title || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [blurb, setBlurb] = useState(initialData?.blurb || '')
  const [time, setTime] = useState(initialData?.time || '')
  const [servings, setServings] = useState(initialData?.servings ? String(initialData.servings) : '')
  const [ingredients, setIngredients] = useState((initialData?.ingredients || []).join('\n'))
  const [instructions, setInstructions] = useState(initialData?.instructions || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [drinks, setDrinks] = useState(initialData?.drinks || '')
  const [source, setSource] = useState(initialData?.source || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls || [])
  // Synlighet: privat (bara jag) eller en/flera gemenskaper. `familyIds` är tom vid privat.
  const [visibility, setVisibility] = useState<'family' | 'private'>(
    initialData?.visibility === 'private' ? 'private' : 'family',
  )
  const [familyIds, setFamilyIds] = useState<string[]>(
    initialData?.familyIds?.length
      ? initialData.familyIds
      : initialData?.familyId
        ? [initialData.familyId]
        : [],
  )
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Hämta gemenskaper och förvald standardgemenskap
  useEffect(() => {
    fetch('/api/family')
      .then((r) => r.json())
      .then((d) => {
        setFamilies(d.families || [])
        // Förvälj standardgemenskapen bara när inget redan är valt (nytt recept).
        setFamilyIds((prev) => (prev.length === 0 && d.activeId ? [d.activeId] : prev))
      })
      .catch(() => {})
  }, [])

  // Kategorier hämtas från den första valda gemenskapen; privata recept får hela
  // användarens kategorilista (de hör inte hemma i någon enskild gemenskap).
  const categoryFamily = visibility === 'private' ? '' : familyIds[0] || ''
  useEffect(() => {
    const fam = categoryFamily ? `&family=${categoryFamily}` : ''
    fetch(`/api/categories?type=${type}${fam}`)
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]))
  }, [type, categoryFamily])

  function toggleFamily(id: string) {
    setFamilyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (visibility === 'family' && familyIds.length === 0) {
      setError('Välj minst en gemenskap — eller spara receptet som privat.')
      return
    }
    setSaving(true)
    setError('')
    const data = {
      type,
      title,
      category,
      blurb: blurb || null,
      time: type === 'recipe' ? time || null : null,
      servings: type === 'recipe' && servings ? parseInt(servings, 10) || null : null,
      ingredients:
        type === 'recipe' ? ingredients.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      instructions: type === 'recipe' ? instructions || null : null,
      content: type === 'tip' ? content || null : null,
      drinks: drinks || null,
      source: source || null,
      url: url || null,
      imageUrls,
      visibility,
      familyIds: visibility === 'private' ? [] : familyIds,
    }

    const isEdit = !!initialData?.id
    const res = await fetch(isEdit ? `/api/entries/${initialData.id}` : '/api/entries', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const entry = await res.json()
      router.push(`/laga/entry/${entry.id}`)
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

      {/* Var receptet ska synas. Privat = bara jag; annars en eller flera gemenskaper. */}
      <div className="space-y-2 rounded-xl border border-brand-accent/20 bg-white p-3">
        <div className="text-sm font-medium text-brand-header">Var ska det synas?</div>
        <div className="flex gap-2">
          {(
            [
              ['family', 'I gemenskap'],
              ['private', 'Bara jag'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setVisibility(value)}
              aria-pressed={visibility === value}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                visibility === value
                  ? 'bg-brand-accent text-white'
                  : 'bg-brand-accent/10 text-brand-accent-dark hover:bg-brand-accent/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visibility === 'private' ? (
          <p className="text-sm text-brand-muted">
            Bara du ser receptet. Du kan dela det till en gemenskap när du vill.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {families.map((f) => {
                const on = familyIds.includes(f.id)
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFamily(f.id)}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      on
                        ? 'border-brand-accent bg-brand-accent/15 font-medium text-brand-accent-dark'
                        : 'border-brand-accent/30 bg-white text-brand-muted hover:border-brand-accent/60'
                    }`}
                  >
                    {on ? '✓ ' : ''}
                    {f.name}
                  </button>
                )
              })}
            </div>
            {families.length > 1 && (
              <p className="text-sm text-brand-muted">
                Välj en eller flera — receptet syns i alla du markerar.
              </p>
            )}
          </>
        )}
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

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-brand-header">Kort beskrivning (valfritt)</label>
        <input
          className={inputClass}
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="En rad om rätten…"
        />
      </div>

      {type === 'recipe' && (
        <>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-brand-header">Tid (valfritt)</label>
              <input className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} placeholder="t.ex. 45 min" />
            </div>
            <div className="w-32 space-y-1.5">
              <label className="text-sm font-medium text-brand-header">Portioner</label>
              <input className={inputClass} type="number" min={1} value={servings} onChange={(e) => setServings(e.target.value)} placeholder="4" />
            </div>
          </div>
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

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-brand-header">Bilder (valfritt)</label>
        <PhotoUploader value={imageUrls} onChange={setImageUrls} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={saving}>
        {saving ? 'Sparar…' : initialData?.id ? 'Uppdatera' : 'Spara'}
      </Button>
    </form>
  )
}
