'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AdminFeedbackItem {
  id: string
  type: string
  message: string
  status: string
  email: string | null
  date: string
}

const TYPE_LABEL: Record<string, string> = {
  bug: 'Bugg',
  idea: 'Idé',
  other: 'Annat',
  upgrade: 'Vill uppgradera',
  report: 'Anmält innehåll',
  // Intresseanmälan från appsidorna på webben (/api/waitlist). `message` = appens namn.
  waitlist: 'Intresseanmälan',
}

export function AdminFeedback({ items }: { items: AdminFeedbackItem[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function setStatus(id: string, status: 'new' | 'handled') {
    setBusy(id)
    await fetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBusy(null)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Ta bort feedbacken?')) return
    setBusy(id)
    await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' })
    setBusy(null)
    router.refresh()
  }

  if (items.length === 0) {
    return <p style={{ fontSize: 14, color: 'var(--muted)' }}>Ingen feedback än.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((f) => {
        const handled = f.status === 'handled'
        return (
          <div
            key={f.id}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--card-bd)',
              background: handled ? 'var(--chip)' : 'var(--card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{TYPE_LABEL[f.type] || 'Annat'}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{f.email || 'okänd'} · {f.date}</span>
              {handled && <span style={{ fontSize: 12, color: 'var(--muted)' }}>· hanterad</span>}
            </div>
            <div style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{f.message}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
              <button
                onClick={() => setStatus(f.id, handled ? 'new' : 'handled')}
                disabled={busy === f.id}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}
              >
                {busy === f.id ? '…' : handled ? 'Markera som ny' : 'Markera hanterad'}
              </button>
              <button
                onClick={() => remove(f.id)}
                disabled={busy === f.id}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#c0392b' }}
              >
                Ta bort
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
