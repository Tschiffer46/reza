'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

const TYPES = [
  { value: 'idea', label: 'Idé / önskemål' },
  { value: 'bug', label: 'Bugg / fel' },
  { value: 'other', label: 'Annat' },
]

export function FeedbackForm() {
  const [type, setType] = useState('idea')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!message.trim()) return
    setBusy(true)
    setError('')
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message }),
    })
    setBusy(false)
    if (res.ok) {
      setSent(true)
      setMessage('')
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Kunde inte skicka')
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-brand-accent/20 bg-white p-5 text-center">
        <p className="text-brand-ink font-medium">Tack för din feedback! 🙏</p>
        <button onClick={() => setSent(false)} className="mt-2 text-sm text-brand-accent-dark underline">
          Skicka mer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={
              'rounded-full border px-3 py-1.5 text-sm font-medium ' +
              (type === t.value
                ? 'border-brand-accent bg-brand-accent/10 text-brand-accent-dark'
                : 'border-brand-accent/30 text-brand-muted')
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Vad fungerar bra, vad saknas, vad krånglar?"
        rows={5}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={send} disabled={busy || !message.trim()}>
        {busy ? 'Skickar…' : 'Skicka feedback'}
      </Button>
    </div>
  )
}
