import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { AppEntry } from '@/lib/apps'

/**
 * Appkort till startsidan och /appar.
 *
 * Kortet bär appens egen färg via tema-klassen från registret: överdelen målas i
 * appens bakgrund och bläck (Laga varm grädde, Gymma nästan svart), medan
 * underdelen ligger kvar på sajtens neutrala yta. Det gör att de två apparna går
 * att skilja åt på en halv sekund utan att sidan blir brokig.
 */
export function AppCard({ app }: { app: AppEntry }) {
  return (
    <Link
      href={`/appar/${app.slug}`}
      className={`${app.theme} group flex flex-col overflow-hidden rounded-2xl border border-brand-line bg-brand-surface transition-shadow hover:shadow-lg hover:shadow-black/5`}
    >
      {/* Färgband i appens egen palett */}
      <div className="flex flex-col gap-3 bg-app-surface px-6 py-7">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-app-accent" aria-hidden />
          <span className="text-xl font-bold text-app-ink">{app.name}</span>
          <span className="ml-auto rounded-full bg-app-accent/12 px-2.5 py-1 text-xs font-semibold text-app-accent">
            {app.statusLabel}
          </span>
        </div>
        <p className="text-2xl font-semibold leading-snug text-app-ink">
          &rdquo;{app.hook}&rdquo;
        </p>
      </div>

      {/* Neutral underdel — husets yta */}
      <div className="flex flex-1 flex-col gap-2 px-6 py-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
          {app.tagline}
        </p>
        <p className="text-brand-ink">{app.blurb}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-site-accent">
          Läs mer om {app.name}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
