/**
 * Central sajt- och företagsidentitet för den publika ytan (vadskavi.nu).
 *
 * Allt som rör avsändaren samlas här så att footer, juridiska sidor, JSON-LD och
 * kontaktsidan visar samma uppgifter. Fyll i / verifiera de riktiga värdena innan
 * lansering — Adtraction kräver synlig företagsidentitet (org.nr + kontaktväg).
 */
export const siteConfig = {
  /** Varumärket som granskas av annonsörer och indexeras av Google. */
  name: 'VadSkaVi',
  /**
   * Kort slogan/tagline för paraplyet. OBS: gäller huset, inte en enskild app —
   * Lagas egen tagline bor i `src/lib/apps.ts`.
   */
  tagline: 'Enkla appar för det du ändå gör varje vecka',
  /** Publik URL utan avslutande slash. Används som metadataBase + i sitemap/JSON-LD. */
  url: 'https://vadskavi.nu',
  domain: 'vadskavi.nu',

  /** Avsändare / personuppgiftsansvarig (registrerat namn enligt allabolag). */
  company: {
    legalName: 'Agile Transition Management AB',
    orgNr: '559378-3045',
    address: {
      street: 'Frejas väg 7',
      postal: '245 65',
      city: 'Hjärup',
      country: 'Sverige',
    },
    email: 'thomas@agiletransition.se',
    website: 'https://www.agiletransition.se',
  },

  /**
   * Löftet om att dela med sig av intäkterna. Andelen används i copy på flera
   * ställen — ändra här, inte i texterna.
   */
  pledge: {
    share: 20,
    purpose: 'mat, hälsa och barns uppväxt',
  },

  /** Datum då de juridiska texterna senast setts över (YYYY-MM-DD). */
  legalUpdated: '2026-08-04',
} as const

/** "Frejas väg 7, 245 65 Hjärup" — adress på en rad. */
export function formattedAddress(): string {
  const { street, postal, city } = siteConfig.company.address
  return `${street}, ${postal} ${city}`
}
