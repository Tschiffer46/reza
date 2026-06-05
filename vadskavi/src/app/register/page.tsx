'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
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
      router.push('/login')
    } else {
      router.push('/laga')
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
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Skapar…' : 'Skapa konto'}
              </Button>
            </form>
            <p className="mt-3 text-sm text-brand-muted">
              Har du redan ett konto?{' '}
              <Link href="/login" className="text-brand-accent-dark underline">
                Logga in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
