'use client'

import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BENEFITS = [
  'Obegränsat antal recept (gratis: 3 per månad)',
  'Egen omslagsbild på er gemenskap',
  'Stötta utvecklingen — fler funktioner på väg',
]

/**
 * Mjuk uppmaning att uppgradera. Eftersom det inte finns något betalflöde än
 * registrerar knappen en intresseanmälan (feedback type=upgrade) som syns i
 * admin — där en admin sedan kan aktivera Premium manuellt.
 */
export function UpgradePrompt({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function register() {
    setState('sending')
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'upgrade', message: 'Vill uppgradera till Premium' }),
    })
    setState(res.ok ? 'done' : 'error')
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-4 text-sm text-brand-accent-dark">
        Tack! Din intresseanmälan är mottagen — vi hör av oss om hur du kommer igång med Premium.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-brand-accent/30 bg-white p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-accent-dark" />
        <h2 className="font-semibold text-brand-header">Uppgradera till Premium</h2>
      </div>
      {!compact && (
        <ul className="mt-3 space-y-1.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-brand-ink">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-accent-dark" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={register} disabled={state === 'sending'} className="mt-4 w-full sm:w-auto">
        {state === 'sending' ? 'Skickar…' : 'Jag är intresserad'}
      </Button>
      {state === 'error' && <p className="mt-2 text-sm text-red-600">Något gick fel — försök igen.</p>}
      <p className="mt-2 text-xs text-brand-muted">Ingen bindning. Vi aktiverar manuellt och hör av oss.</p>
    </div>
  )
}
