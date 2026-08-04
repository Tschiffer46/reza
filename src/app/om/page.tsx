import type { Metadata } from 'next'
import { ContentPage } from '@/components/ContentPage'
import { siteConfig, formattedAddress } from '@/lib/site-config'
import { apps } from '@/lib/apps'

export const metadata: Metadata = {
  title: 'Om VadSkaVi',
  description:
    'VadSkaVi bygger små, enkla appar för vardagen. Läs om idén, om hur vi ser på integritet och europeisk drift, och om löftet att skänka 20 % av intäkterna till välgörande ändamål.',
  alternates: { canonical: '/om' },
}

export default function OmPage() {
  const c = siteConfig.company
  const { share, purpose } = siteConfig.pledge

  return (
    <ContentPage
      title="Om VadSkaVi"
      intro="Vi bygger små appar för vardagen — och håller oss till fyra regler medan vi gör det."
    >
      <h2>Idén</h2>
      <p>
        De flesta appar vill ha mer av din uppmärksamhet än de förtjänar. De växer tills de
        gör allt, ber om uppgifter de inte behöver och tjänar pengar på att känna dig lite
        för väl. Vi tror på motsatsen: en app ska göra en sak, göra den ordentligt och sedan
        hålla tyst.
      </p>
      <p>
        {siteConfig.name} är därför inte en produkt utan ett hus med flera. Just nu bor{' '}
        {apps.map((a, i) => (
          <span key={a.slug}>
            {i > 0 ? (i === apps.length - 1 ? ' och ' : ', ') : ''}
            <a href={`/appar/${a.slug}`}>{a.name}</a> ({a.tagline.toLowerCase()})
          </span>
        ))}{' '}
        här. Det som binder ihop dem är inte ett gemensamt konto eller ett ekosystem — det är
        hållningen nedan.
      </p>

      <h2>Enkelt och begripligt</h2>
      <p>
        En app ska gå att förstå utan manual och användas med en hand, ofta i en situation
        där du har annat för dig: smetiga fingrar vid spisen, ett vilande set på gymmet. Det
        betyder att vi säger nej till fler funktioner än vi säger ja till. Varje sak som
        läggs till gör de andra lite svårare att hitta, och den avvägningen tar vi på allvar.
      </p>

      <h2>Din integritet är inte till salu</h2>
      <p>
        Vi säljer inga uppgifter, profilerar dig inte för annonser och lägger inga spårare i
        apparna. Vår affärsmodell är att du betalar för något du tycker är värt pengar — inte
        att någon annan betalar för att nå dig.
      </p>
      <p>
        Vi samlar dessutom hellre in för lite än för mycket. Det som kan stanna på din telefon
        gör det: Gymma har varken konto eller molnsynk, och din träningsdata lämnar aldrig
        enheten. Laga behöver en server för att ni ska kunna dela recept inom familjen, och då
        gäller punkten nedan. Exakt vad varje app hanterar står på respektive appsida, och
        detaljerna i vår <a href="/integritetspolicy">integritetspolicy</a>.
      </p>

      <h2>Byggt och driftat i Europa</h2>
      <p>
        Bolaget är svenskt, och servrarna som lagrar era uppgifter står i Europa under
        europeiska regler. Det är ett aktivt val: vi vill att både vi och våra användare ska
        ha rättigheter som går att hävda på riktigt.
      </p>
      <p>
        Vi säger också rakt ut var vi ännu inte är framme. När du i Laga klistrar in en text,
        en länk eller ett foto och får tillbaka ett strukturerat recept sker den tolkningen
        i dag hos en amerikansk AI-leverantör. Det är den enda delen av tjänsten som lämnar
        EU, den sparas inte hos oss längre än det tar att skapa receptet, och vi arbetar för
        att flytta även den till en europeisk leverantör. Vi tycker det är bättre att skriva
        det här än att avrunda uppåt.
      </p>

      <h2>{share} % till välgörande ändamål</h2>
      <p>
        {share} % av intäkterna, efter driftskostnader, går till välgörande ändamål inom{' '}
        {purpose}. Det är ett löfte om hur pengarna ska fördelas, inte en marknadsföringsrad
        — och därför säger vi också vad vi ännu inte kan säga.
      </p>
      <p>
        Vi har i dag inga intäkter att dela. När det finns sådana redovisar vi öppet vilka
        mottagarna blev och hur mycket det handlade om, tillsammans med hur summan räknats
        fram. Vi namnger ingen organisation i förväg, eftersom ett löfte om framtida gåvor
        till en namngiven mottagare låter mer bindande än det är.
      </p>

      <h2>Vem ligger bakom?</h2>
      <p>
        {siteConfig.name} drivs av {c.legalName} (org.nr {c.orgNr}), ett svenskt bolag baserat
        i {c.address.city}. Vi är små med flit — det är lättare att stå för sina principer när
        man inte har någon att skylla på.
      </p>
      <ul>
        <li>{c.legalName}</li>
        <li>Org.nr {c.orgNr}</li>
        <li>{formattedAddress()}</li>
        <li>
          <a href={`mailto:${c.email}`}>{c.email}</a>
        </li>
        <li>
          <a href={c.website} target="_blank" rel="noopener noreferrer">
            {c.website.replace('https://', '')}
          </a>
        </li>
      </ul>
    </ContentPage>
  )
}
