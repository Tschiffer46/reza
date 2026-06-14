import Link from 'next/link'
import { ChefHat } from 'lucide-react'
import { auth } from '@/auth'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Sektioner på vadskavi.nu. Fler läggs till bredvid "Laga" framöver.
const SECTIONS = [
  { href: '/laga', title: 'Laga', desc: 'Gemenskapens recept och mattips', icon: ChefHat },
]

export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    return (
      <div className="min-h-screen">
        <Header>
          <Link href="/laga/profile">
            <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
              Konto
            </Button>
          </Link>
        </Header>
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="mb-4 text-xl font-semibold text-brand-header">
            Hej{session.user.name ? ` ${session.user.name}` : ''}! Vad vill du göra?
          </h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTIONS.map(({ href, title, desc, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-5 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent-dark">
                  <Icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-semibold text-brand-header">{title}</span>
                  <span className="block text-sm text-brand-muted">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header>
        <Link href="/login">
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Logga in
          </Button>
        </Link>
      </Header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Välkommen till VadSkaVi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-brand-muted">
            <p>Gemenskapens egna sajt — börja med receptboken under «Laga».</p>
            <Link href="/login" className="inline-block">
              <Button>Kom igång</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
