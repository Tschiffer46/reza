import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AppShell } from '@/components/laga/AppShell'
import { Icon } from '@/components/laga/ui'
import { FeedbackForm } from '@/components/FeedbackForm'

export default async function FeedbackPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href="/laga/profile"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}
        >
          <Icon name="back" size={18} /> Tillbaka
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-brand-header">Tyck till</h1>
          <p className="text-sm text-brand-muted">
            Vi läser allt. Berätta vad du gillar, saknar eller stört dig på.
          </p>
        </div>
        <FeedbackForm />
      </div>
    </AppShell>
  )
}
