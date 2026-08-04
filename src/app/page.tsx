import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicShell } from '@/components/PublicShell'
import { AppCard } from '@/components/marketing/AppCard'
import { PrincipleCard } from '@/components/marketing/PrincipleCard'
import { Button } from '@/components/ui/button'
import { apps } from '@/lib/apps'
import { siteConfig } from '@/lib/site-config'
import { home, principles } from '@/lib/site-copy'

export const metadata: Metadata = {
  title: 'VadSkaVi — enkla appar för vardagen',
  description:
    'VadSkaVi bygger små, enkla appar för vardagen: Laga för familjens recept och Gymma för träningsloggen. Byggda i Sverige, driftade i Europa, utan spårning.',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="bg-brand-header text-white">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {home.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">{home.heroText}</p>
          <div className="mt-8 flex justify-center">
            <Link href="#appar">
              <Button size="lg" className="bg-white text-brand-header hover:bg-white/90">
                {home.heroCta}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Apparna */}
      <section id="appar" className="mx-auto max-w-5xl scroll-mt-8 px-4 py-16">
        <h2 className="text-2xl font-bold text-brand-header">{home.appsTitle}</h2>
        <p className="mt-3 max-w-2xl text-brand-muted">{home.appsIntro}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </section>

      {/* Principerna */}
      <section id="principer" className="border-y border-brand-line bg-brand-surface">
        <div className="mx-auto max-w-5xl scroll-mt-8 px-4 py-16">
          <h2 className="text-2xl font-bold text-brand-header">{home.principlesTitle}</h2>
          <p className="mt-3 max-w-2xl text-brand-muted">{home.principlesIntro}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {principles.map((p) => (
              <PrincipleCard key={p.title} principle={p} />
            ))}
          </div>
          <Link href="/om" className="mt-8 inline-block">
            <Button variant="outline" className="border-site-accent text-site-accent">
              {home.principlesCta}
            </Button>
          </Link>
        </div>
      </section>

      {/* Avsändare */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-brand-header">{home.aboutTitle}</h2>
        <p className="mt-4 text-brand-muted">
          {siteConfig.name} drivs av {siteConfig.company.legalName}, ett svenskt bolag i{' '}
          {siteConfig.company.address.city}. Vi är små med flit: det är lättare att stå för
          sina principer när man inte har någon att skylla på.
        </p>
        <Link href="/om" className="mt-6 inline-block">
          <Button variant="outline">{home.aboutCta}</Button>
        </Link>
      </section>
    </PublicShell>
  )
}
