'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/laga/ui'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Förifyll "Familjen <efternamn>" — bara om användarens namn faktiskt har ett efternamn,
  // annars blir förslaget "Familjen Thomas", vilket är värre än ett tomt fält.
  useEffect(() => {
    let cancelled = false
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        const parts = String(p?.name || '').trim().split(/\s+/).filter(Boolean)
        if (!cancelled && parts.length >= 2) setName((n) => n || `Familjen ${parts[parts.length - 1]}`)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  async function finish(action: 'create' | 'join') {
    setBusy(true)
    setError('')
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, name, code }),
    })
    if (res.ok) {
      router.push('/laga')
      router.refresh()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Något gick fel')
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Logo size="lg" />
      </div>

      <div style={{ width: '100%', maxWidth: 440, background: 'var(--card)', border: '1px solid var(--card-bd)', borderRadius: 'var(--radius)', padding: '28px 26px' }}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) finish('create')
          }}
        >
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 6 }}>Vad heter er receptbok?</h1>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              Familjen, kompisgänget eller kursen. Du kan ändra namnet sen.
            </p>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Familjen Schiffer"
            aria-label="Receptbokens namn"
            className={inputClass}
          />
          <Button type="submit" className="w-full" size="lg" disabled={busy || !name.trim()}>
            Skapa receptboken
          </Button>
        </form>

        <div style={{ marginTop: 18 }}>
          {!showCode ? (
            <button
              type="button"
              onClick={() => setShowCode(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', padding: 0 }}
            >
              Har du en kod? <span style={{ textDecoration: 'underline' }}>Gå med</span>
            </button>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (code.trim()) finish('join')
              }}
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Inbjudningskod"
                aria-label="Inbjudningskod"
                className={inputClass}
              />
              <Button type="submit" variant="outline" disabled={busy || !code.trim()}>
                Gå med
              </Button>
            </form>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
