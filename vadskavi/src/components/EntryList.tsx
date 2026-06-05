'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CategoryDTO, EntryDTO } from '@/lib/types'
import { EntryCard } from '@/components/EntryCard'
import { SearchBar } from '@/components/SearchBar'
import { CategoryFilter } from '@/components/CategoryFilter'

const TYPE_TABS = [
  { value: '', label: 'Alla' },
  { value: 'recipe', label: 'Recept' },
  { value: 'tip', label: 'Tips' },
]

const SORTS = [
  { value: 'createdAt', label: 'Senaste' },
  { value: 'timesCooked', label: 'Mest lagad' },
  { value: 'lastCooked', label: 'Nyligen lagad' },
  { value: 'title', label: 'Titel' },
]

export function EntryList({
  initialEntries,
  categories,
  families = [],
}: {
  initialEntries: EntryDTO[]
  categories: CategoryDTO[]
  families?: { id: string; name: string }[]
}) {
  const [entries, setEntries] = useState(initialEntries)
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [family, setFamily] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [loading, setLoading] = useState(false)
  const firstRender = useRef(true)

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type) params.set('type', type)
    if (category) params.set('category', category)
    if (family) params.set('family', family)
    if (sort) params.set('sort', sort)
    const res = await fetch(`/api/entries?${params.toString()}`)
    const data = await res.json()
    setEntries(data.entries || [])
    setLoading(false)
  }, [q, type, category, family, sort])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    fetchEntries()
  }, [fetchEntries])

  const visibleCategories = categories.filter((c) => !type || c.type === type)
  const showFamilyBadge = families.length > 1

  return (
    <div className="space-y-3">
      <SearchBar value={searchInput} onChange={setSearchInput} />

      {families.length > 1 && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <FamilyChip active={!family} onClick={() => setFamily('')}>
            Alla familjer
          </FamilyChip>
          {families.map((f) => (
            <FamilyChip key={f.id} active={family === f.id} onClick={() => setFamily(f.id)}>
              {f.name}
            </FamilyChip>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-brand-accent/10 p-1">
          {TYPE_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setType(t.value)
                setCategory('')
              }}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                type === t.value ? 'bg-brand-accent text-white' : 'text-brand-accent-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-brand-accent/40 bg-white px-2 py-1.5 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {visibleCategories.length > 0 && (
        <CategoryFilter categories={visibleCategories} selected={category} onChange={setCategory} />
      )}

      {loading ? (
        <p className="py-8 text-center text-brand-muted">Laddar…</p>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-brand-muted">
          Inga recept ännu. Tryck på <span className="font-semibold">Lägg till</span> för att börja!
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} showFamily={showFamilyBadge} />
          ))}
        </div>
      )}
    </div>
  )
}

function FamilyChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors ${
        active ? 'bg-brand-header text-white' : 'bg-brand-header/10 text-brand-header hover:bg-brand-header/20'
      }`}
    >
      {children}
    </button>
  )
}
