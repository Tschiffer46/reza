import Link from 'next/link'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header>
        <Link href="/login">
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Logga in
          </Button>
        </Link>
      </Header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Välkommen till VadSkaVi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-brand-muted">
            <p>
              Familjens gemensamma receptbok. Samla recept och mattips, sök bland dem och
              håll koll på vad ni faktiskt lagar.
            </p>
            <Link href="/login" className="inline-block">
              <Button>Kom igång</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
