import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { FeedbackForm } from '@/components/FeedbackForm'

export default async function FeedbackPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen pb-20">
      <Header>
        <Link href="/laga/profile">
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Tillbaka
          </Button>
        </Link>
      </Header>
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-header">Tyck till</h1>
          <p className="text-sm text-brand-muted">
            Vi läser allt. Berätta vad du gillar, saknar eller stört dig på.
          </p>
        </div>
        <FeedbackForm />
      </main>
      <NavBar />
    </div>
  )
}
