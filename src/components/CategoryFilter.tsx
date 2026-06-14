'use client'

import type { CategoryDTO } from '@/lib/types'

export function CategoryFilter({
  categories,
  selected,
  onChange,
}: {
  categories: CategoryDTO[]
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
      <Pill active={!selected} onClick={() => onChange('')}>
        Alla
      </Pill>
      {categories.map((c) => (
        <Pill key={c.id} active={selected === c.name} onClick={() => onChange(c.name)}>
          {c.name}
        </Pill>
      ))}
    </div>
  )
}

function Pill({
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
        active
          ? 'bg-brand-accent text-white'
          : 'bg-brand-accent/10 text-brand-accent-dark hover:bg-brand-accent/20'
      }`}
    >
      {children}
    </button>
  )
}
