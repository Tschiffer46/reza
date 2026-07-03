import type { Metadata } from 'next'
import { ContentPage } from '@/components/ContentPage'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Användarvillkor — VadSkaVi',
  description:
    'Villkor för att använda VadSkaVi och appen VadSkaVi Laga: konto, innehåll, acceptabel användning, Premium-prenumeration och ansvar.',
  alternates: { canonical: '/anvandarvillkor' },
}

export default function AnvandarvillkorPage() {
  const c = siteConfig.company
  return (
    <ContentPage title="Användarvillkor" updated={siteConfig.legalUpdated}>
      <p>
        Dessa villkor gäller när du använder {siteConfig.name} på {siteConfig.domain} och i
        mobilappen <strong>VadSkaVi Laga</strong> (tillsammans ”tjänsten”). Tjänsten
        tillhandahålls av {c.legalName} (org.nr {c.orgNr}). Genom att skapa ett konto eller
        använda tjänsten godkänner du villkoren.
      </p>

      <h2>Tjänsten</h2>
      <p>
        VadSkaVi är en receptbok för hushåll och grupper (”gemenskaper”) där medlemmar samlar
        recept och tips, betygsätter, kommenterar och planerar matlagning. AI används för att
        extrahera strukturerad receptdata ur text, länkar och foton du själv tillhandahåller.
      </p>

      <h2>Konto och radering</h2>
      <ul>
        <li>Du ansvarar för att uppgifterna på ditt konto är riktiga och för att skydda din
          inloggning.</li>
        <li>Du kan när som helst radera ditt konto — i appen under <strong>Konto → Radera
          konto</strong>, eller genom att kontakta oss. Personuppgifter och inloggningsvägar tas
          då bort. Recept du delat i en gemenskap kan finnas kvar för övriga medlemmar, men utan
          koppling till dig (”Raderad användare”).</li>
      </ul>

      <h2>Ditt innehåll och acceptabel användning</h2>
      <p>
        Du äger innehållet du lägger in (recept, bilder, kommentarer, inlägg) och ger oss den
        licens som krävs för att visa det för medlemmarna i dina gemenskaper. Du ansvarar för att
        du har rätt att dela det du laddar upp. Det är inte tillåtet att publicera innehåll som
        är olagligt, stötande, hotfullt, hatiskt, pornografiskt, vilseledande eller som gör
        intrång i annans upphovsrätt eller integritet, eller att använda tjänsten för spam eller
        missbruk.
      </p>
      <p>
        Stötande innehåll kan <strong>rapporteras direkt i appen</strong> (på recept och inlägg).
        Rapporter granskas skyndsamt; vi kan ta bort innehåll, stänga av användare och stänga
        gemenskaper som bryter mot villkoren. Du kan också alltid lämna en gemenskap själv.
      </p>

      <h2>Premium-prenumeration</h2>
      <ul>
        <li>Grundfunktionerna är gratis med en begränsning i antal recept per månad. Premium ger
          bland annat obegränsat antal recept.</li>
        <li>I appen köps Premium som en automatiskt förnyande prenumeration via App Store
          (månads- eller årsabonnemang; aktuellt pris visas vid köpet). Betalningen dras via
          ditt App Store-konto och förnyas automatiskt tills den sägs upp.</li>
        <li>Du säger upp eller ändrar prenumerationen i dina App Store-inställningar
          (Inställningar → ditt namn → Prenumerationer) senast 24 timmar före
          förnyelsedatumet. Apples villkor för köp och återbetalning gäller för köp via App
          Store.</li>
      </ul>

      <h2>Ansvar</h2>
      <p>
        Tjänsten tillhandahålls i befintligt skick. Recept och AI-extraherat innehåll kan
        innehålla fel — kontrollera alltid själv ingredienser, allergener och
        tillagningsanvisningar. Vi ansvarar inte för innehåll som användare lägger in och inte
        för indirekta skador, i den utsträckning ansvar kan begränsas enligt tvingande lag.
      </p>

      <h2>Ändringar</h2>
      <p>
        Vi kan uppdatera villkoren; väsentliga ändringar meddelas i tjänsten. Datum för senaste
        ändring visas överst på sidan.
      </p>

      <h2>Kontakt</h2>
      <p>
        Frågor om villkoren? Kontakta oss på{' '}
        <a href={`mailto:${c.email}`}>{c.email}</a>. Hur vi behandlar personuppgifter beskrivs i
        vår <a href="/integritetspolicy">integritetspolicy</a>.
      </p>
    </ContentPage>
  )
}
