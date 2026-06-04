'use client'

import { Search } from 'lucide-react'

export function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sök recept & tips…"
        className="w-full rounded-lg border border-brand-accent/40 bg-white py-2 pl-9 pr-3 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
    </div>
  )
}
