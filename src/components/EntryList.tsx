'use client'

import { useState, useEffect, useCallback } from 'react'
import { EntryCard } from './EntryCard'
import { CategoryFilter } from './CategoryFilter'
import { SearchBar } from './SearchBar'

interface Entry {
  id: string
  type: string
  title: string
  category: string
  timesCooked: number
  imageUrls: string[]
  createdAt: string
}

interface EntryListProps {
  initialEntries: Entry[]
  initialTotal: number
  categories: string[]
}

export function EntryList({ initialEntries, initialTotal, categories }: EntryListProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [total, setTotal] = useState(initialTotal)
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [loading, setLoading] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (category) params.set('category', category)
    if (search) params.set('q', search)
    if (sort) params.set('sort', sort)

    const res = await fetch(`/api/entries?${params}`)
    const data = await res.json()
    setEntries(data.entries)
    setTotal(data.total)
    setLoading(false)
  }, [type, category, search, sort])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <div className="space-y-4">
      <SearchBar value={searchInput} onChange={setSearchInput} />

      {/* Type toggle */}
      <div className="flex gap-2">
        {['', 'recipe', 'tip'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              type === t
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {t === '' ? 'Alla' : t === 'recipe' ? 'Recept' : 'Tips'}
          </button>
        ))}
      </div>

      <CategoryFilter categories={categories} selected={category} onChange={setCategory} />

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-amber-700">Sortera:</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm px-2 py-1 rounded-lg border border-amber-200 bg-white text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="createdAt">Senast inlagda</option>
          <option value="timesCooked">Mest lagade</option>
          <option value="lastCooked">Senast lagade</option>
          <option value="title">Bokstavsordning</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-amber-100 p-4 animate-pulse">
              <div className="h-5 bg-amber-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-amber-50 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-amber-600 py-8">
          {search ? 'Inga resultat hittades' : 'Inga poster ännu'}
        </p>
      ) : (
        <>
          <p className="text-sm text-amber-600">{total} {total === 1 ? 'resultat' : 'resultat'}</p>
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
