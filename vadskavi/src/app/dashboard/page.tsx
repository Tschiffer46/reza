import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const name = session.user.name ?? session.user.email ?? 'användare'

  async function logout() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-screen">
      <Header>
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-white/60 text-white hover:bg-white/10"
          >
            Logga ut
          </Button>
        </form>
      </Header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Hej, {name}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-brand-muted">
            <p>Du är inloggad på VadSkaVi.</p>
            <p className="text-sm">
              Inloggad som <span className="text-brand-ink">{session.user.email}</span>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
