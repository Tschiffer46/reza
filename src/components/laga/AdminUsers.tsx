'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AdminUser {
  id: string
  name: string | null
  email: string
  plan: string
  isAdmin: boolean
  families: number
}

export function AdminUsers({ users }: { users: AdminUser[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function patch(id: string, body: { plan?: string; isAdmin?: boolean }) {
    setBusy(id)
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(null)
    router.refresh()
  }

  const pill = (active: boolean, color: string): React.CSSProperties => ({
    flexShrink: 0,
    border: '1px solid ' + (active ? color : 'var(--card-bd)'),
    color: active ? color : 'var(--muted)',
    background: 'transparent',
    borderRadius: 10,
    padding: '7px 12px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {users.map((u) => {
        const paid = u.plan === 'paid'
        return (
          <div
            key={u.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--card-bd)',
              background: 'var(--card)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.name || u.email}
                {u.isAdmin && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>admin</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {u.email} · {u.families} gemenskaper · {paid ? 'betalande' : 'gratis'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => patch(u.id, { plan: paid ? 'free' : 'paid' })}
                disabled={busy === u.id}
                style={pill(paid, 'var(--accent)')}
              >
                {busy === u.id ? '…' : paid ? 'Gör gratis' : 'Gör betald'}
              </button>
              <button
                onClick={() => patch(u.id, { isAdmin: !u.isAdmin })}
                disabled={busy === u.id}
                style={pill(u.isAdmin, '#b07d2a')}
              >
                {u.isAdmin ? 'Ta admin' : 'Gör admin'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
