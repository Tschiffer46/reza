import type { Metadata } from 'next'
import { PublicShell } from '@/components/PublicShell'
import { AppCard } from '@/components/marketing/AppCard'
import { apps } from '@/lib/apps'
import { home } from '@/lib/site-copy'

export const metadata: Metadata = {
  title: 'Apparna — VadSkaVi',
  description:
    'VadSkaVis appar: Laga, familjens receptbok, och Gymma, träningsloggen för styrketräning. Enkla att använda och byggda med respekt för din integritet.',
  alternates: { canonical: '/appar' },
}

export default function ApparPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold text-brand-header">{home.appsTitle}</h1>
        <p className="mt-3 max-w-2xl text-lg text-brand-muted">{home.appsIntro}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </section>
    </PublicShell>
  )
}
