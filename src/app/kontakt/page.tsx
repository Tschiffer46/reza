import type { Metadata } from 'next'
import { ContentPage } from '@/components/ContentPage'
import { siteConfig, formattedAddress } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Kontakt — VadSkaVi',
  description:
    'Kontakta VadSkaVi och Agile Transition Management AB. Här hittar du e-post, postadress och organisationsnummer.',
  alternates: { canonical: '/kontakt' },
}

export default function KontaktPage() {
  const c = siteConfig.company
  return (
    <ContentPage
      title="Kontakt"
      intro="Har du frågor om VadSkaVi, samarbeten eller behandling av personuppgifter? Hör av dig."
    >
      <h2>E-post</h2>
      <p>
        <a href={`mailto:${c.email}`}>{c.email}</a>
      </p>

      <h2>Avsändare</h2>
      <p>VadSkaVi ({siteConfig.domain}) drivs av:</p>
      <ul>
        <li>{c.legalName}</li>
        <li>Org.nr {c.orgNr}</li>
        <li>{formattedAddress()}, {c.address.country}</li>
        <li>
          <a href={c.website} target="_blank" rel="noopener noreferrer">
            {c.website.replace('https://', '')}
          </a>
        </li>
      </ul>

      <p>
        {c.legalName} är personuppgiftsansvarig för behandlingen av personuppgifter på{' '}
        {siteConfig.domain}. Läs mer i vår <a href="/integritetspolicy">integritetspolicy</a>.
      </p>
    </ContentPage>
  )
}
