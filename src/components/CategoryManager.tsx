'use client'

import { useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { CategoryDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent'

export function CategoryManager() {
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState<'recipe' | 'tip'>('recipe')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/categories')
    if (res.ok) setCategories(await res.json())
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function add() {
    if (!name.trim()) return
    setBusy(true)
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    })
    setName('')
    await load()
    setBusy(false)
  }

  async function remove(id: string) {
    setBusy(true)
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    await load()
    setBusy(false)
  }

  const groups: { key: 'recipe' | 'tip'; label: string }[] = [
    { key: 'recipe', label: 'Recept' },
    { key: 'tip', label: 'Tips' },
  ]

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-xl border border-brand-accent/20 bg-white p-4">
        <h2 className="text-lg font-semibold text-brand-header">Lägg till kategori</h2>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kategorinamn"
          />
          <select
            className="rounded-lg border border-brand-accent/40 bg-white px-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
            value={type}
            onChange={(e) => setType(e.target.value as 'recipe' | 'tip')}
          >
            <option value="recipe">Recept</option>
            <option value="tip">Tips</option>
          </select>
          <Button onClick={add} disabled={busy || !name.trim()}>
            Lägg till
          </Button>
        </div>
      </section>

      {groups.map((g) => (
        <section key={g.key} className="space-y-2">
          <h2 className="text-lg font-semibold text-brand-header">{g.label}</h2>
          <ul className="space-y-1">
            {categories
              .filter((c) => c.type === g.key)
              .map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-brand-accent/20 bg-white px-3 py-2"
                >
                  <span className="text-brand-ink">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    disabled={busy}
                    className="text-red-600 disabled:opacity-50"
                    aria-label="Ta bort"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
