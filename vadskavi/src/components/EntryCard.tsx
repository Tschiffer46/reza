import Link from 'next/link'
import type { EntryDTO } from '@/lib/types'

export function EntryCard({ entry }: { entry: EntryDTO }) {
  return (
    <Link
      href={`/entry/${entry.id}`}
      className="block rounded-xl border border-brand-accent/20 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <h3 className="truncate font-semibold text-brand-header">{entry.title}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-xs text-brand-accent-dark">
          {entry.category}
        </span>
        <span className="text-xs text-brand-muted">{entry.type === 'tip' ? 'Tips' : 'Recept'}</span>
        {entry.timesCooked > 0 && (
          <span className="text-xs text-brand-muted">· Lagad {entry.timesCooked}×</span>
        )}
      </div>
    </Link>
  )
}
