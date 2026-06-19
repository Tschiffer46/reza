import type { Metadata } from 'next'
import { ContentPage } from '@/components/ContentPage'
import { siteConfig, formattedAddress } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Om VadSkaVi',
  description:
    'VadSkaVi är familjens egna receptbok – byggd kring tanken att de bästa recepten är de som någon du känner faktiskt lagat. Läs om idén och avsändaren.',
  alternates: { canonical: '/om' },
}

export default function OmPage() {
  const c = siteConfig.company
  return (
    <ContentPage
      title="Om VadSkaVi"
      intro="De bästa recepten är de som någon du känner redan lagat – och gillat."
    >
      <h2>Idén</h2>
      <p>
        Internet är fullt av recept, men det är svårt att veta vilka som faktiskt blir bra.
        VadSkaVi vänder på det: i stället för anonyma betyg och sökmotoroptimerade matbloggar
        bygger vi receptboken kring människor du litar på. Familjen, vännerna, gemenskapen.
        När mormor lägger in sina köttbullar vet du att de är värda att laga.
      </p>

      <h2>Varför familjekurering?</h2>
      <p>
        Ett recept som gått i arv eller delats inom en gemenskap bär med sig något mer än en
        ingredienslista – det bär förtroende. Vi vill göra det enkelt att samla, hitta och laga
        de rätter som redan är bevisat goda, och att planera veckans middagar utifrån dem. Du
        slipper gissa, och du slipper leta.
      </p>

      <h2>Lättviktigt och europeiskt</h2>
      <p>
        Vi håller tjänsten snabb, mobilanpassad och fri från tunga spårningsskript. Analys hålls
        lättviktig och styrs av ditt samtycke. Det ska kännas tryggt att använda VadSkaVi – både
        i köket och med dina uppgifter.
      </p>

      <h2>Vem ligger bakom?</h2>
      <p>
        VadSkaVi drivs av {c.legalName} (org.nr {c.orgNr}), ett svenskt bolag baserat i{' '}
        {c.address.city}. Vi bygger digitala produkter med fokus på enkelhet och integritet.
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
