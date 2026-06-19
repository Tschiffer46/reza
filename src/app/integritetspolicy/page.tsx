import type { Metadata } from 'next'
import { ContentPage } from '@/components/ContentPage'
import { siteConfig, formattedAddress } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Integritetspolicy — VadSkaVi',
  description:
    'Så behandlar VadSkaVi och Agile Transition Management AB dina personuppgifter, inklusive affiliate-spårning, rättslig grund, lagringstid och dina rättigheter enligt GDPR.',
  alternates: { canonical: '/integritetspolicy' },
}

export default function IntegritetspolicyPage() {
  const c = siteConfig.company
  return (
    <ContentPage title="Integritetspolicy" updated={siteConfig.legalUpdated}>
      <p>
        Den här policyn beskriver hur {siteConfig.name} ({siteConfig.domain}) behandlar
        personuppgifter. Vi värnar din integritet och samlar inte in mer än vad som behövs.
      </p>

      <h2>Personuppgiftsansvarig</h2>
      <ul>
        <li>{c.legalName} (org.nr {c.orgNr})</li>
        <li>{formattedAddress()}, {c.address.country}</li>
        <li>
          <a href={`mailto:${c.email}`}>{c.email}</a>
        </li>
      </ul>

      <h2>Vilka uppgifter vi behandlar</h2>
      <ul>
        <li>
          <strong>Kontouppgifter:</strong> om du skapar ett konto behandlar vi din e-postadress,
          ditt namn och dina recept/inlägg samt teknisk inloggningsinformation.
        </li>
        <li>
          <strong>Samtyckesval:</strong> dina val i cookie-bannern sparas så att vi vet vilka
          cookies du tillåtit.
        </li>
        <li>
          <strong>Teknisk data:</strong> för drift och säkerhet kan webbserverloggar tillfälligt
          innehålla IP-adress och webbläsarinformation.
        </li>
        <li>
          <strong>Analys:</strong> vi använder ingen analys i dagsläget. Om vi inför det sker det
          lättviktigt och först efter ditt samtycke.
        </li>
      </ul>

      <h2>Affiliate-länkar och tredjepartscookies</h2>
      <p>
        Vissa receptsidor innehåller annonslänkar (affiliate). När du klickar på en sådan länk –
        till exempel ”Handla ingredienserna” – skickas du vidare till en samarbetspartner via ett
        affiliate-nätverk (t.ex. Adtraction). Nätverket och/eller handlaren kan då sätta cookies i
        din webbläsare för att registrera att besöket kommer från oss, så att vi kan få provision.
        Dessa cookies sätts av tredjepart på deras egna webbplatser och omfattas av deras
        respektive integritets- och cookiepolicyer. Sådan spårning aktiveras endast i enlighet med
        dina samtyckesval. Läs mer på sidan{' '}
        <a href="/om-annonslankar">Om annonslänkar</a> och i vår{' '}
        <a href="/cookiepolicy">cookiepolicy</a>.
      </p>

      <h2>Rättslig grund</h2>
      <ul>
        <li>
          <strong>Avtal:</strong> behandling av kontouppgifter för att tillhandahålla tjänsten.
        </li>
        <li>
          <strong>Samtycke:</strong> icke-nödvändiga cookies samt analys- och marknadsförings-
          /affiliate-spårning.
        </li>
        <li>
          <strong>Berättigat intresse:</strong> grundläggande drift, säkerhet och förhindrande av
          missbruk.
        </li>
      </ul>

      <h2>Lagringstid</h2>
      <ul>
        <li>Kontouppgifter lagras så länge du har ett konto och raderas när kontot avslutas.</li>
        <li>Samtyckesval lagras tills du ändrar dem eller rensar din webbläsare.</li>
        <li>Tekniska loggar lagras under en kort tid för drift och säkerhet.</li>
      </ul>

      <h2>Dina rättigheter</h2>
      <p>Enligt dataskyddsförordningen (GDPR) har du rätt att:</p>
      <ul>
        <li>begära tillgång till de uppgifter vi behandlar om dig,</li>
        <li>få felaktiga uppgifter rättade,</li>
        <li>begära radering (”rätten att bli bortglömd”),</li>
        <li>invända mot eller begära begränsning av behandlingen,</li>
        <li>få ut dina uppgifter (dataportabilitet),</li>
        <li>klaga hos tillsynsmyndigheten Integritetsskyddsmyndigheten (IMY).</li>
      </ul>
      <p>
        Kontakta oss på <a href={`mailto:${c.email}`}>{c.email}</a> för att utöva dina rättigheter.
      </p>

      <h2>Återkalla samtycke</h2>
      <p>
        Du kan när som helst ändra eller återkalla ditt samtycke till cookies via länken
        ”Cookie-inställningar” längst ned på sidan. Återkallat samtycke påverkar inte lagligheten
        av behandling som skedde innan återkallelsen.
      </p>

      <p className="text-sm text-brand-muted">
        Detta är en allmän mall. Stäm av formuleringarna mot er faktiska databehandling innan
        publicering.
      </p>
    </ContentPage>
  )
}
