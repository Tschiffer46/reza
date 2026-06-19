import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ConsentBanner } from '@/components/ConsentBanner'

/** Gemensamt skal för alla publika sidor: header, innehåll, footer och cookie-banner. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ConsentBanner />
    </div>
  )
}
