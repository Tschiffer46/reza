'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CookButton({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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
    <Button onClick={handleCook} disabled={loading} className="gap-2">
      <ChefHat className="h-4 w-4" />
      {loading ? '…' : 'Lagad!'}
    </Button>
  )
}
