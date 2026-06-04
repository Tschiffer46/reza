import Link from 'next/link'
import type { EntryDTO } from '@/lib/types'

export function EntryCard({ entry }: { entry: EntryDTO }) {
  return (
    <Link
      href={`/entry/${entry.id}`}
      className="flex items-start gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
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
      </div>
      {entry.imageUrls.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/images/${entry.imageUrls[0]}`}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
        />
      )}
    </Link>
  )
}
