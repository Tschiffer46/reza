import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { PhoneFrame } from '@/components/marketing/PhoneFrame'
import { WaitlistForm } from '@/components/marketing/WaitlistForm'
import { Button } from '@/components/ui/button'
import { apps, getApp } from '@/lib/apps'
import { pledgeLine } from '@/lib/site-copy'

export function generateStaticParams() {
  return apps.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const app = getApp(slug)
  if (!app) return { title: 'Appen hittades inte — VadSkaVi' }
  return {
    title: `${app.name} — ${app.tagline} | VadSkaVi`,
    description: app.blurb,
    alternates: { canonical: `/appar/${app.slug}` },
  }
}

export default async function AppPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const app = getApp(slug)
  if (!app) notFound()

  return (
    <PublicShell>
      {/* Hero i appens egen palett. Kanten behövs för Laga, vars kräm är samma
          färg som sidbakgrunden — utan den flyter heron ihop med sektionen under. */}
      <section className={`${app.theme} border-b border-brand-line bg-app-surface`}>
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-app-accent" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide text-app-ink/70">
              {app.tagline}
            </span>
            <span className="rounded-full bg-app-accent/12 px-2.5 py-1 text-xs font-semibold text-app-accent">
              {app.statusLabel}
            </span>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-app-ink sm:text-5xl">
            {app.name}
          </h1>
          <p className="mt-3 max-w-2xl text-2xl font-semibold text-app-ink/80">
            &rdquo;{app.hook}&rdquo;
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-app-ink/70">{app.blurb}</p>
          {app.primaryCta ? (
            <Link href={app.primaryCta.href} className="mt-8 inline-block">
              <Button size="lg" className="bg-app-accent text-white hover:opacity-90">
                {app.primaryCta.label}
              </Button>
            </Link>
          ) : null}
        </div>
      </section>

      {/* Funktioner */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold text-brand-header">Vad {app.name} gör</h2>
        <div className={`${app.theme} mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3`}>
          {app.features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-brand-line bg-brand-surface p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-app-accent/12 text-app-accent">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-brand-header">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skärmbilder */}
      <section className="border-y border-brand-line bg-brand-surface">
        <div className={`${app.theme} mx-auto max-w-5xl px-4 py-16`}>
          <h2 className="text-2xl font-bold text-brand-header">Så ser det ut</h2>
          <div className="mt-10 grid grid-cols-2 justify-items-center gap-8 sm:grid-cols-3">
            {app.screenshots.map((shot) => (
              <PhoneFrame key={shot.file} shot={shot} />
            ))}
          </div>
        </div>
      </section>

      {/* Integritet */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-site-soft text-site-accent">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-brand-header">
          Dina uppgifter i {app.name}
        </h2>
        <ul className="mt-5 space-y-3">
          {app.privacy.map((point) => (
            <li key={point} className="flex gap-3 leading-relaxed text-brand-ink">
              <span
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-site-accent"
                aria-hidden
              />
              {point}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-brand-muted">
          Fullständiga villkor finns i vår{' '}
          <Link href="/integritetspolicy" className="text-site-accent underline">
            integritetspolicy
          </Link>
          .
        </p>
      </section>

      {/* Intresseanmälan */}
      {app.waitlist ? (
        <section className="border-y border-brand-line bg-brand-surface">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h2 className="text-2xl font-bold text-brand-header">
              Vill du veta när {app.name} kommer till App Store?
            </h2>
            <p className="mt-3 text-brand-muted">
              {app.name} finns i dag {app.status === 'web' ? 'i webbläsaren' : 'i testning'} och
              är på väg till App Store. Lämna din e-postadress så hör vi av oss den dagen den
              släpps — inget nyhetsbrev, bara det ena mejlet.
            </p>
            <div className="mt-6">
              <WaitlistForm app={app.slug} appName={app.name} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Vidare läsning */}
      {app.related ? (
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-xl font-bold text-brand-header">{app.related.label}</h2>
          <p className="mt-3 text-brand-muted">{app.related.text}</p>
          <Link
            href={app.related.href}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-site-accent"
          >
            {app.related.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : null}

      {/* Löftet */}
      <section className="mx-auto max-w-3xl px-4 pb-16 text-center">
        <p className="text-brand-muted">
          {pledgeLine}{' '}
          <Link href="/om" className="text-site-accent underline">
            Så här tänker vi
          </Link>
          .
        </p>
      </section>
    </PublicShell>
  )
}
