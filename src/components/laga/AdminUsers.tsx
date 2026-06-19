'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AdminUser {
  id: string
  name: string | null
  email: string
  plan: string
  isAdmin: boolean
  bonusCredits: number
  families: number
}

export function AdminUsers({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [credit, setCredit] = useState<Record<string, string>>({})

  async function patch(id: string, body: { plan?: string; isAdmin?: boolean; addCredits?: number }) {
    setBusy(id)
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(null)
    router.refresh()
  }

  async function remove(u: AdminUser) {
    if (
      !confirm(
        `Ta bort ${u.name || u.email}?\n\nKontot inaktiveras (personen kan inte logga in) men recept, betyg och kommentarer de lagt till behålls i gemenskaperna. Kan inte ångras.`,
      )
    )
      return
    setBusy(u.id)
    await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    setBusy(null)
    router.refresh()
  }

  const pill = (active: boolean, color: string): React.CSSProperties => ({
    border: '1px solid ' + (active ? color : 'var(--card-bd)'),
    color: active ? color : 'var(--ink)',
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
        const amount = credit[u.id] ?? '5'
        return (
          <div
            key={u.id}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--card-bd)',
              background: 'var(--card)',
            }}
          >
            {/* info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{u.name || u.email}</span>
              {u.isAdmin && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>admin</span>}
              {paid && <span style={{ fontSize: 12, color: '#b07d2a', fontWeight: 600 }}>betalande</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, wordBreak: 'break-word' }}>
              {u.email} · {u.families} gemenskaper · {u.bonusCredits} bonusrecept
            </div>

            {/* controls */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
              <button onClick={() => patch(u.id, { plan: paid ? 'free' : 'paid' })} disabled={busy === u.id} style={pill(paid, 'var(--accent)')}>
                {busy === u.id ? '…' : paid ? 'Gör gratis' : 'Gör betald'}
              </button>
              <button onClick={() => patch(u.id, { isAdmin: !u.isAdmin })} disabled={busy === u.id} style={pill(u.isAdmin, '#b07d2a')}>
                {u.isAdmin ? 'Ta admin' : 'Gör admin'}
              </button>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setCredit((c) => ({ ...c, [u.id]: e.target.value }))}
                  style={{ width: 56, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--field-bd)', background: 'var(--card)', color: 'var(--ink)', fontSize: 13, outline: 'none' }}
                  aria-label="Antal recept att ge"
                />
                <button
                  onClick={() => patch(u.id, { addCredits: Math.max(1, parseInt(amount, 10) || 0) })}
                  disabled={busy === u.id || !(parseInt(amount, 10) > 0)}
                  style={{ ...pill(true, 'var(--accent)'), color: '#fff', background: 'var(--accent)', border: 'none' }}
                >
                  Ge recept
                </button>
              </span>
              {u.id !== currentUserId && (
                <button
                  onClick={() => remove(u)}
                  disabled={busy === u.id}
                  style={{ ...pill(false, '#c0392b'), color: '#c0392b', borderColor: '#e0b4ab', marginLeft: 'auto' }}
                >
                  Ta bort
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
