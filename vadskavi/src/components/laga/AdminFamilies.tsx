'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AdminFamily {
  id: string
  name: string
  status: string
  inviteCode: string
  members: number
  entries: number
}

export function AdminFamilies({ families }: { families: AdminFamily[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function setStatus(id: string, status: 'active' | 'suspended') {
    setBusy(id)
    await fetch(`/api/admin/families/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBusy(null)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {families.map((f) => {
        const suspended = f.status === 'suspended'
        return (
          <div
            key={f.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--card-bd)',
              background: suspended ? 'var(--chip)' : 'var(--card)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {f.name}
                {suspended && <span style={{ marginLeft: 8, fontSize: 12, color: '#c0392b', fontWeight: 600 }}>(stängd)</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {f.members} medlemmar · {f.entries} recept · kod {f.inviteCode}
              </div>
            </div>
            <button
              onClick={() => setStatus(f.id, suspended ? 'active' : 'suspended')}
              disabled={busy === f.id}
              style={{
                flexShrink: 0,
                border: '1px solid ' + (suspended ? 'var(--accent)' : '#d96a52'),
                color: suspended ? 'var(--accent)' : '#c0392b',
                background: 'transparent',
                borderRadius: 10,
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              {busy === f.id ? '…' : suspended ? 'Återöppna' : 'Stäng'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
