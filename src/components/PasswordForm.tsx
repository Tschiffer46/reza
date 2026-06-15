'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PasswordForm() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    setError('')
    const res = await fetch('/api/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setBusy(false)
    if (res.ok) {
      setPassword('')
      setMsg('Lösenord sparat ✓')
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Kunde inte spara')
    }
  }

  return (
    <form onSubmit={save} className="space-y-2">
      <label className="text-sm font-medium text-brand-header">Sätt / ändra lösenord</label>
      <div className="flex gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nytt lösenord (minst 8 tecken)"
          autoComplete="new-password"
          className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <Button type="submit" disabled={busy || password.length < 8}>
          {busy ? 'Sparar…' : 'Spara'}
        </Button>
      </div>
      {msg && <p className="text-sm text-brand-accent-dark">{msg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
