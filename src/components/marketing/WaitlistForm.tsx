'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

type State = 'idle' | 'sending' | 'done' | 'error'

/**
 * Intresseanmälan inför App Store-släpp.
 *
 * Postar till den publika endpointen `/api/waitlist`. Fältet `företag` är en
 * honeypot: det är dolt för människor men fylls i av enkla spamrobotar, och
 * servern kastar då tyst bort anmälan.
 */
export function WaitlistForm({ app, appName }: { app: string; appName: string }) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app, email, company }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Något gick fel. Försök igen om en stund.')
        setState('error')
        return
      }
      setState('done')
    } catch {
      setError('Vi når inte servern just nu. Försök igen om en stund.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-sage">
        <Check className="h-4 w-4 shrink-0" />
        Tack! Vi hör av oss till {email} när {appName} släpps.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`waitlist-${app}`} className="sr-only">
          Din e-postadress
        </label>
        <input
          id={`waitlist-${app}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@epost.se"
          autoComplete="email"
          className="h-11 flex-1 rounded-lg border border-brand-line bg-brand-surface px-3.5 text-brand-ink outline-none focus:border-site-accent focus:ring-2 focus:ring-site-accent/30"
        />
        {/* Honeypot — dold för människor, lockande för robotar. */}
        <input
          type="text"
          name="företag"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
        <Button
          type="submit"
          size="lg"
          disabled={state === 'sending'}
          className="bg-site-accent hover:bg-site-accent-dark"
        >
          {state === 'sending' ? 'Skickar…' : 'Hör av er'}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-brand-accent-dark">{error}</p> : null}
      <p className="mt-2 text-xs text-brand-muted">
        Vi sparar bara adressen, använder den enbart för att meddela släppet och raderar
        den efteråt.
      </p>
    </form>
  )
}
