import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Tags } from 'lucide-react'
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { ProfileForm } from '@/components/ProfileForm'
import { Button } from '@/components/ui/button'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  async function logout() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-screen pb-20">
      <Header>
        <Link href="/laga">
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Tillbaka
          </Button>
        </Link>
      </Header>
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-header">Konto</h1>
          <p className="text-sm text-brand-muted">{user?.email}</p>
        </div>

        <ProfileForm initialName={user?.name || ''} />

        <div className="space-y-2">
          <Link
            href="/laga/family"
            className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 hover:shadow-md"
          >
            <Users className="h-5 w-5 text-brand-accent-dark" /> Familj
          </Link>
          <Link
            href="/laga/categories"
            className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 hover:shadow-md"
          >
            <Tags className="h-5 w-5 text-brand-accent-dark" /> Kategorier
          </Link>
        </div>

        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full">
            Logga ut
          </Button>
        </form>
      </main>
      <NavBar />
    </div>
  )
}
