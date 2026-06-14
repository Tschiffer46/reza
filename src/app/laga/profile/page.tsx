import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Tags } from 'lucide-react'
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { ProfileForm } from '@/components/ProfileForm'
import { PasswordForm } from '@/components/PasswordForm'
import { Avatar } from '@/components/laga/ui'
import { Button } from '@/components/ui/button'
import { FREE_MONTHLY_LIMIT, monthlyEntryCount } from '@/lib/plan'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, plan: true, isAdmin: true, avatar: true, bio: true },
  })
  const isPaid = user?.plan === 'paid'
  const usedThisMonth = await monthlyEntryCount(session.user.id)

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
        <div className="flex items-center gap-3">
          <Avatar name={user?.name || 'Du'} image={user?.avatar || undefined} size={52} />
          <div>
            <h1 className="text-xl font-semibold text-brand-header">{user?.name || 'Mitt konto'}</h1>
            <p className="text-sm text-brand-muted">{user?.email}</p>
          </div>
        </div>

        <div className="rounded-xl border border-brand-accent/20 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-header">Plan</p>
              <p className="text-sm text-brand-muted">{isPaid ? 'Betalande — obegränsat antal recept' : 'Gratis'}</p>
            </div>
            <span className="rounded-full bg-brand-accent/15 px-3 py-1 text-xs font-semibold text-brand-accent-dark">
              {isPaid ? 'Premium' : 'Gratis'}
            </span>
          </div>
          {!isPaid && (
            <p className="mt-3 text-sm text-brand-muted">
              Recept denna månad:{' '}
              <span className="font-semibold text-brand-ink">
                {usedThisMonth} av {FREE_MONTHLY_LIMIT}
              </span>
              {usedThisMonth >= FREE_MONTHLY_LIMIT && ' — gränsen nådd'}
            </p>
          )}
        </div>

        <ProfileForm
          initialName={user?.name || ''}
          initialBio={user?.bio || ''}
          initialAvatar={user?.avatar || null}
        />

        <PasswordForm />

        <div className="space-y-2">
          <Link
            href="/laga/family"
            className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 hover:shadow-md"
          >
            <Users className="h-5 w-5 text-brand-accent-dark" /> Gemenskap
          </Link>
          <Link
            href="/laga/categories"
            className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 hover:shadow-md"
          >
            <Tags className="h-5 w-5 text-brand-accent-dark" /> Kategorier
          </Link>
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 hover:shadow-md"
            >
              <Users className="h-5 w-5 text-brand-accent-dark" /> Admin
            </Link>
          )}
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
