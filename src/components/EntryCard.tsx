import Link from 'next/link'

interface EntryCardProps {
  entry: {
    id: string
    type: string
    title: string
    category: string
    timesCooked: number
    imageUrls: string[]
    createdAt: string
  }
}

export function EntryCard({ entry }: EntryCardProps) {
  return (
    <Link
      href={`/entry/${entry.id}`}
      className="block bg-white rounded-lg border border-amber-100 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{entry.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {entry.category}
            </span>
            {entry.type === 'tip' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Tips
              </span>
            )}
          </div>
          {entry.type === 'recipe' && entry.timesCooked > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Lagad {entry.timesCooked} {entry.timesCooked === 1 ? 'gång' : 'gånger'}
            </p>
          )}
        </div>
        {entry.imageUrls.length > 0 && (
          <div className="w-16 h-16 rounded-lg bg-amber-100 flex-shrink-0 overflow-hidden">
            <img
              src={`/api/images/${entry.imageUrls[0]}`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </Link>
  )
}
