'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthButtons } from '@/components/OAuthButtons'

function RegisterInner() {
  const router = useRouter()
  const params = useSearchParams()
  // Tillåt bara interna mål (skydd mot open redirect)
  const rawNext = params.get('next') || ''
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/laga'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // 409: adressen har redan ett konto. Det kan vara skapat med Apple, Google eller e-postlänk
  // och sakna lösenord — då är e-postlänken enda vägen in utan att gå via Apple/Google.
  const [exists, setExists] = useState(false)
  const [linkState, setLinkState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  async function sendLink() {
    setLinkState('sending')
    const res = await signIn('nodemailer', { email, callbackUrl: next, redirect: false })
    setLinkState(res?.error ? 'failed' : 'sent')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setExists(false)
    setLinkState('idle')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (res.status === 409) {
      setExists(true)
      setBusy(false)
      return
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Kunde inte skapa konto')
      setBusy(false)
      return
    }
    // Logga in direkt
    const login = await signIn('credentials', { email, password, redirect: false })
    setBusy(false)
    if (login?.error) {
      router.push(`/login?next=${encodeURIComponent(next)}`)
    } else {
      // Ny användare utan inbjudan → onboarding; inbjudna (next=/join/...) går dit.
      router.push(next === '/laga' ? '/onboarding' : next)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Skapa konto</CardTitle>
          </CardHeader>
          <CardContent>
            <OAuthButtons callbackUrl={next} />
            <div className="my-4 flex items-center gap-3 text-xs text-brand-muted">
              <span className="h-px flex-1 bg-brand-accent/20" /> eller <span className="h-px flex-1 bg-brand-accent/20" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Namn (valfritt)" autoComplete="name" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@exempel.se"
                autoComplete="email"
                required
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lösenord (minst 8 tecken)"
                autoComplete="new-password"
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {exists && (
                <div className="space-y-2 rounded-lg border border-brand-accent/30 p-3 text-sm">
                  <p>
                    Det finns redan ett konto med <strong>{email}</strong>. Logga in i stället — med
                    lösenord, med en e-postlänk, eller med Apple eller Google om du skapade kontot så.
                  </p>
                  {linkState === 'sent' ? (
                    <p className="text-brand-accent-dark">Vi har skickat en inloggningslänk till {email}.</p>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={sendLink}
                      disabled={linkState === 'sending'}
                    >
                      {linkState === 'sending' ? 'Skickar…' : 'Logga in med e-postlänk'}
                    </Button>
                  )}
                  {linkState === 'failed' && (
                    <p className="text-red-600">Kunde inte skicka länken. Försök igen om en stund.</p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Skapar…' : 'Skapa konto'}
              </Button>
            </form>
            <p className="mt-3 text-sm text-brand-muted">
              Har du redan ett konto?{' '}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand-accent-dark underline">
                Logga in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  )
}
