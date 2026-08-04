/**
 * All copy för den publika paraplyytan (startsida, principer, footer) på ett ställe.
 *
 * Varför en egen fil: sajten är svensk i dag, men principerna om integritet och
 * EU-suveränitet pekar mot en publik utanför Sverige. Ligger texterna samlade blir
 * en engelsk version en syskonfil (`site-copy.en.ts`) i stället för en jakt genom
 * varenda komponent. Skriv därför inte ny marknadsföringstext direkt i JSX.
 */
import { Heart, Leaf, Lock, Sparkles, type LucideIcon } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'

const { share, purpose } = siteConfig.pledge

export interface Principle {
  icon: LucideIcon
  title: string
  text: string
}

export const home = {
  heroTitle: 'Enkla appar för det du ändå gör varje vecka',
  heroText:
    'Maten på bordet. Passet på gymmet. Vi bygger små appar som tar bort friktionen ur vardagens rutiner — och som du kan lita på med dina uppgifter.',
  heroCta: 'Se apparna',

  appsTitle: 'Apparna',
  appsIntro:
    'Två i dag, byggda av samma händer och efter samma principer. En app gör en sak, och gör den ordentligt.',

  principlesTitle: 'Så här tänker vi',
  principlesIntro:
    'Samma fyra regler gäller för allt vi bygger. De är anledningen att välja oss framför något som gör nästan samma sak.',
  principlesCta: 'Läs mer om hur vi tänker',

  aboutTitle: 'Vem ligger bakom?',
  aboutCta: 'Läs mer om oss',
} as const

/**
 * De fyra principerna. Håll formuleringarna kontrollerbara — allt här ska gå att
 * granska mot hur apparna faktiskt fungerar. Se `apps.ts` för appspecifika detaljer.
 */
export const principles: Principle[] = [
  {
    icon: Sparkles,
    title: 'Enkelt och begripligt',
    text: 'En app ska gå att förstå utan manual och användas med en hand. Vi säger hellre nej till en funktion än gör vardagen krångligare — färre saker, gjorda ordentligt.',
  },
  {
    icon: Lock,
    title: 'Din integritet är inte till salu',
    text: 'Vi säljer inga uppgifter, profilerar dig inte för annonser och lägger inga spårare i apparna. Det vi inte behöver samlar vi inte in — och det som kan stanna på din telefon gör det.',
  },
  {
    icon: Leaf,
    title: 'Byggt och driftat i Europa',
    text: 'Företaget är svenskt och servrarna står i Europa, under europeiska regler. Där något ännu inte är det säger vi det rakt ut i stället för att avrunda uppåt.',
  },
  {
    icon: Heart,
    title: `${share} % till välgörande ändamål`,
    text: `${share} % av intäkterna, efter driftskostnader, går till välgörande ändamål inom ${purpose}. Vilka mottagarna blir och hur mycket det handlar om redovisar vi öppet när det finns intäkter att dela.`,
  },
]

/**
 * Kort version av löftet — används i footern och på appsidorna. Andelen och
 * ändamålet kommer från `siteConfig.pledge`, som är enda sanningskällan: en
 * hårdkodad siffra här skulle hamna i otakt så fort löftet ändras.
 */
export const pledgeLine = `${share} % av intäkterna, efter driftskostnader, går till välgörande ändamål.`
