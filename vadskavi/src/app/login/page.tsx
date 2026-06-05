'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const skickat = params.get('skickat')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicEmail, setMagicEmail] = useState('')
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
      router.push('/laga')
      router.refresh()
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!magicEmail.trim()) return
    await signIn('nodemailer', { email: magicEmail.trim(), callbackUrl: '/laga' })
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md space-y-4 px-4 py-10">
        {skickat ? (
          <Card>
            <CardHeader>
              <CardTitle>Kolla din mejl 📧</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-brand-muted">
              <p>Vi har skickat en inloggningslänk. Klicka på länken i mejlet (gäller 24 h).</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Logga in</CardTitle>
              </CardHeader>
              <CardContent>
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
                  <Link href="/register" className="text-brand-accent-dark underline">
                    Skapa ett
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">…eller magisk länk</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={sendMagicLink} className="space-y-3">
                  <Input
                    type="email"
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    placeholder="du@exempel.se"
                    autoComplete="email"
                  />
                  <Button type="submit" variant="outline" className="w-full">
                    Skicka inloggningslänk
                  </Button>
                  <p className="text-xs text-brand-muted">Logga in utan lösenord — vi mejlar en länk.</p>
                </form>
              </CardContent>
            </Card>
          </>
        )}
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
