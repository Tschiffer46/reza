'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'

export function EntryActions({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Ta bort detta? Det går inte att ångra.')) return
    setDeleting(true)
    const res = await fetch(`/api/entries/${entryId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/laga')
      router.refresh()
    } else {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/laga/entry/${entryId}/edit`}
        className="flex items-center gap-1 text-sm text-brand-accent-dark hover:underline"
      >
        <Pencil className="h-4 w-4" /> Redigera
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1 text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" /> {deleting ? 'Tar bort…' : 'Ta bort'}
      </button>
    </div>
  )
}
