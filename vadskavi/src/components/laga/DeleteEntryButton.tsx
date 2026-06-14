'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/laga/ui'

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function del() {
    if (!confirm('Ta bort receptet? Det går inte att ångra.')) return
    setBusy(true)
    setError('')
    const res = await fetch(`/api/entries/${entryId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/laga')
      router.refresh()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Kunde inte ta bort')
      setBusy(false)
    }
  }

  return (
    <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--card-bd)' }}>
      <button
        onClick={del}
        disabled={busy}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'transparent',
          border: '1px solid #d96a52',
          color: '#c0392b',
          borderRadius: 12,
          padding: '11px 18px',
          cursor: 'pointer',
          fontSize: 14.5,
          fontWeight: 600,
        }}
      >
        <Icon name="trash" size={16} color="#c0392b" /> {busy ? 'Tar bort…' : 'Ta bort receptet'}
      </button>
      {error && <p style={{ marginTop: 8, fontSize: 13.5, color: '#c0392b' }}>{error}</p>}
    </div>
  )
}
