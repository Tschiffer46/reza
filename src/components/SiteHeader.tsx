import Link from 'next/link'
import { Button } from '@/components/ui/button'

const NAV = [
  { href: '/recept', label: 'Recept' },
  { href: '/om', label: 'Om' },
  { href: '/kontakt', label: 'Kontakt' },
]

/** Publik marknadsföringsheader. Statisk (ingen auth) så sidorna kan byggas som SSG. */
export function SiteHeader() {
  return (
    <header className="bg-brand-header text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          VadSkaVi
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-2 py-1.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
          <Link href="/login" className="ml-1">
            <Button size="sm" className="bg-white text-brand-header hover:bg-white/90">
              Logga in
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
