import type { Metadata } from 'next'
import { ContentPage } from '@/components/ContentPage'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Om annonslänkar — VadSkaVi',
  description:
    'Reklamupplysning: VadSkaVi innehåller affiliate-länkar. Vi kan få provision när du handlar via dem – utan att det påverkar ditt pris.',
  alternates: { canonical: '/om-annonslankar' },
}

export default function OmAnnonslankarPage() {
  return (
    <ContentPage
      title="Om annonslänkar"
      intro="Öppenhet är viktigt för oss. Här förklarar vi hur annonslänkar fungerar på VadSkaVi."
      updated={siteConfig.legalUpdated}
    >
      <h2>Sajten innehåller reklam</h2>
      <p>
        {siteConfig.name} innehåller <strong>annonslänkar</strong> (även kallade affiliate-länkar).
        Det betyder att vissa länkar – till exempel knappen ”Handla ingredienserna” på våra
        receptsidor – går till en samarbetspartner via ett affiliate-nätverk.
      </p>

      <h2>Vi kan få provision</h2>
      <p>
        Om du klickar på en annonslänk och handlar hos partnern kan vi få en provision. Det är så
        vi finansierar och utvecklar tjänsten.
      </p>

      <h2>Det påverkar inte ditt pris</h2>
      <p>
        Provisionen betalas av handlaren – <strong>priset blir aldrig högre för dig</strong> för att
        du gått via en av våra länkar. Våra recept och rekommendationer styrs av vad vi tycker är
        bra mat, inte av provisionen.
      </p>

      <h2>Hur länkarna märks</h2>
      <p>
        Annonslänkar är märkta med ”Annonslänk” eller liknande i anslutning till länken, och de
        öppnas i en ny flik. Hur klick mäts och vilka cookies som kan sättas beskrivs i vår{' '}
        <a href="/cookiepolicy">cookiepolicy</a> och{' '}
        <a href="/integritetspolicy">integritetspolicy</a>.
      </p>
    </ContentPage>
  )
}
