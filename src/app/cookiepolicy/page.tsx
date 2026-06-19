import type { Metadata } from 'next'
import { ContentPage } from '@/components/ContentPage'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Cookiepolicy — VadSkaVi',
  description:
    'Vilka cookies VadSkaVi använder – nödvändiga, analys och affiliate – och hur du styr dem via vårt cookie-samtycke.',
  alternates: { canonical: '/cookiepolicy' },
}

export default function CookiepolicyPage() {
  return (
    <ContentPage title="Cookiepolicy" updated={siteConfig.legalUpdated}>
      <p>
        Cookies är små textfiler som sparas i din webbläsare. Vi använder dem så sparsamt som
        möjligt. Icke-nödvändiga cookies sätts först efter ditt samtycke.
      </p>

      <h2>Kategorier av cookies</h2>
      <ul>
        <li>
          <strong>Nödvändiga (alltid på):</strong> krävs för att sajten ska fungera, till exempel
          inloggningssession och säkerhet. Sätts utan samtycke eftersom tjänsten inte fungerar utan
          dem. Hit hör bland annat inloggningscookien.
        </li>
        <li>
          <strong>Analys (kräver samtycke):</strong> skulle hjälpa oss förstå hur sajten används.
          Vi använder ingen analys i dagsläget – kategorin finns för framtida, samtyckesstyrd och
          lättviktig statistik.
        </li>
        <li>
          <strong>Marknadsföring / affiliate (kräver samtycke):</strong> rör mätning av
          annonslänkar. När du klickar på en ”Handla”-länk kan affiliate-nätverket (t.ex.
          Adtraction) och handlaren sätta cookies på sina egna webbplatser för att registrera
          klicket. Dessa tredjepartscookies styrs av respektive parts policyer.
        </li>
      </ul>

      <h2>Samtycke och hur du styr cookies</h2>
      <p>
        När du besöker sajten visas en cookie-banner där du kan acceptera alla cookies, välja
        kategorier eller endast tillåta nödvändiga. Inga icke-nödvändiga cookies aktiveras innan du
        gjort ditt val. Du kan när som helst ändra eller återkalla ditt samtycke via länken{' '}
        <strong>”Cookie-inställningar”</strong> längst ned på varje sida.
      </p>
      <p>
        Du kan även blockera eller radera cookies i din webbläsares inställningar. Tänk på att
        sajten kan sluta fungera korrekt om du blockerar nödvändiga cookies.
      </p>

      <p>
        Hur vi behandlar personuppgifter beskrivs i vår{' '}
        <a href="/integritetspolicy">integritetspolicy</a>.
      </p>

      <p className="text-sm text-brand-muted">
        Detta är en allmän mall. Stäm av cookielistan mot de cookies som faktiskt sätts innan
        publicering.
      </p>
    </ContentPage>
  )
}
