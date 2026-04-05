'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  type: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'recipe' | 'tip'>('recipe')
  const [error, setError] = useState('')

  async function loadCategories() {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  useEffect(() => { loadCategories() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setError('')
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), type: newType }),
    })
    if (res.ok) {
      setNewName('')
      loadCategories()
    } else {
      const data = await res.json()
      setError(data.error || 'Kunde inte lägga till')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Ta bort kategorin "${name}"?`)) return
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
    loadCategories()
  }

  const recipeCategories = categories.filter((c) => c.type === 'recipe')
  const tipCategories = categories.filter((c) => c.type === 'tip')

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
          <h1 className="text-xl font-bold text-amber-800">Kategorier</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Add form */}
        <form onSubmit={handleAdd} className="bg-white rounded-lg border border-amber-200 p-4 space-y-3">
          <h2 className="font-medium text-amber-800">Lägg till kategori</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNewType('recipe')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                newType === 'recipe' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
              }`}
            >
              Recept
            </button>
            <button
              type="button"
              onClick={() => setNewType('tip')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                newType === 'tip' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
              }`}
            >
              Tips
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={inputClass}
              placeholder="Kategorinamn"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              Lägg till
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        {/* Recipe categories */}
        <div>
          <h2 className="font-medium text-amber-800 mb-2">Receptkategorier</h2>
          <div className="bg-white rounded-lg border border-amber-200 divide-y divide-amber-100">
            {recipeCategories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-800">{c.name}</span>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  Ta bort
                </button>
              </div>
            ))}
            {recipeCategories.length === 0 && (
              <p className="px-4 py-3 text-amber-600 text-sm">Inga receptkategorier</p>
            )}
          </div>
        </div>

        {/* Tip categories */}
        <div>
          <h2 className="font-medium text-amber-800 mb-2">Tipskategorier</h2>
          <div className="bg-white rounded-lg border border-amber-200 divide-y divide-amber-100">
            {tipCategories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-800">{c.name}</span>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  Ta bort
                </button>
              </div>
            ))}
            {tipCategories.length === 0 && (
              <p className="px-4 py-3 text-amber-600 text-sm">Inga tipskategorier</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
