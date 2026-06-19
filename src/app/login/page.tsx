'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Header } from '@/components/Header'
import { Logo } from '@/components/laga/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthButtons } from '@/components/OAuthButtons'

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  // Tillåt bara interna mål (skydd mot open redirect)
  const rawNext = params.get('next') || ''
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/laga'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setBusy(false)
    if (res?.error) {
      setError('Fel e-post eller lösenord')
    } else {
      router.push(next)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md space-y-4 px-4 py-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="text-sm text-brand-muted">Logga in till er gemensamma receptbok</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Logga in</CardTitle>
          </CardHeader>
          <CardContent>
            <OAuthButtons callbackUrl={next} />
            <div className="my-4 flex items-center gap-3 text-xs text-brand-muted">
              <span className="h-px flex-1 bg-brand-accent/20" /> eller <span className="h-px flex-1 bg-brand-accent/20" />
            </div>
            <form onSubmit={loginPassword} className="space-y-3">
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
                placeholder="Lösenord"
                autoComplete="current-password"
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Loggar in…' : 'Logga in'}
              </Button>
            </form>
            <p className="mt-3 text-sm text-brand-muted">
              Inget konto?{' '}
              <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-brand-accent-dark underline">
                Skapa ett
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
