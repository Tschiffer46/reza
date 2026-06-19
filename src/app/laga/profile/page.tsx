import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Tags, MessageSquare, ShieldCheck } from 'lucide-react'
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/db'
import { isEnvAdmin } from '@/lib/family'
import { AppShell } from '@/components/laga/AppShell'
import { Icon, Avatar } from '@/components/laga/ui'
import { ProfileForm } from '@/components/ProfileForm'
import { PasswordForm } from '@/components/PasswordForm'
import { UpgradePrompt } from '@/components/UpgradePrompt'
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
  const showAdmin = !!user?.isAdmin || isEnvAdmin(user?.email)
  const usedThisMonth = await monthlyEntryCount(session.user.id)

  async function logout() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/laga"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}
        >
          <Icon name="back" size={18} /> Tillbaka
        </Link>

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
              <p className="text-sm text-brand-muted">{isPaid ? 'Premium — obegränsat antal recept' : 'Gratis'}</p>
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

        {!isPaid && <UpgradePrompt />}

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
          <Link
            href="/laga/feedback"
            className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 hover:shadow-md"
          >
            <MessageSquare className="h-5 w-5 text-brand-accent-dark" /> Tyck till
          </Link>
          {showAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 hover:shadow-md"
            >
              <ShieldCheck className="h-5 w-5 text-brand-accent-dark" /> Admin
            </Link>
          )}
        </div>

        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full">
            Logga ut
          </Button>
        </form>
      </div>
    </AppShell>
  )
}
