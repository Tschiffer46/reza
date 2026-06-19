import Link from 'next/link'
import { siteConfig, formattedAddress } from '@/lib/site-config'
import { CookieSettingsButton } from '@/components/CookieSettingsButton'

const LEGAL = [
  { href: '/integritetspolicy', label: 'Integritetspolicy' },
  { href: '/cookiepolicy', label: 'Cookiepolicy' },
  { href: '/om-annonslankar', label: 'Om annonslänkar' },
  { href: '/kontakt', label: 'Kontakt' },
]

/** Publik sidfot med synlig företagsidentitet (krav för Adtraction) + juridiska länkar. */
export function SiteFooter() {
  const c = siteConfig.company
  return (
    <footer className="mt-20 border-t border-brand-line bg-brand-surface">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-2">
        <div className="space-y-2 text-sm text-brand-muted">
          <p className="text-base font-semibold text-brand-header">{siteConfig.name}</p>
          <p>{siteConfig.tagline}.</p>
          <div className="space-y-0.5 pt-3">
            <p className="font-medium text-brand-ink">{c.legalName}</p>
            <p>Org.nr {c.orgNr}</p>
            <p>{formattedAddress()}</p>
            <p>
              <a href={`mailto:${c.email}`} className="transition-colors hover:text-brand-accent">
                {c.email}
              </a>
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-2 text-sm sm:items-end">
          {LEGAL.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-brand-muted transition-colors hover:text-brand-accent"
            >
              {l.label}
            </Link>
          ))}
          <CookieSettingsButton />
        </nav>
      </div>
      <div className="border-t border-brand-line">
        <p className="mx-auto max-w-5xl px-4 py-4 text-xs text-brand-muted">
          © {new Date().getFullYear()} {c.legalName}. Innehållet kan innehålla annonslänkar.
        </p>
      </div>
    </footer>
  )
}
