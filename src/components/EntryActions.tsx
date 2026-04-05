'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function EntryActions({ entryId }: { entryId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    await fetch(`/api/entries/${entryId}`, { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push(`/entry/${entryId}/edit`)}
        className="text-sm text-amber-600 hover:text-amber-800"
      >
        Redigera
      </button>
      {showConfirm ? (
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 font-medium"
          >
            Bekräfta
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-sm text-gray-400"
          >
            Avbryt
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm text-red-400 hover:text-red-600"
        >
          Ta bort
        </button>
      )}
    </div>
  )
}
