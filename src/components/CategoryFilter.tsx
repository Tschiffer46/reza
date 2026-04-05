'use client'

interface CategoryFilterProps {
  categories: string[]
  selected: string
  onChange: (category: string) => void
}

export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <button
        onClick={() => onChange('')}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selected === ''
            ? 'bg-amber-600 text-white'
            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        }`}
      >
        Alla
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === cat
              ? 'bg-amber-600 text-white'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
