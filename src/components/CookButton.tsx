'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CookButtonClient({ entryId }: { entryId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCook() {
    setLoading(true)
    await fetch(`/api/entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cooked' }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleCook}
      disabled={loading}
      className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
    >
      {loading ? '...' : 'Lagad!'}
    </button>
  )
}
