/**
 * Appregistret — enda sanningskällan för vilka appar VadSkaVi består av.
 *
 * Startsidan, /appar, /appar/[slug], sitemap och footern läser alla härifrån.
 * Att lägga till app nummer tre ska vara EN post i `apps` nedan — ingen ny sida,
 * ingen ny route, ingen ny länklista att komma ihåg.
 *
 * Samma princip som onboarding-registret i laga-app: registret är sanningen,
 * komponenterna är bara ritytan.
 */
import {
  Battery,
  BookOpen,
  Check,
  Hand,
  Heart,
  ListChecks,
  type LucideIcon,
  Search,
  Smartphone,
  Sparkles,
  Timer,
  Users,
  WifiOff,
} from 'lucide-react'

/** `web` = går att använda i webbläsaren idag. `soon` = ännu inte släppt. */
export type AppStatus = 'web' | 'soon'

export interface AppFeature {
  icon: LucideIcon
  title: string
  text: string
}

export interface AppScreenshot {
  /** Filnamn i `public/img/appar/`. Saknas filen ritas en platshållare. */
  file: string
  alt: string
  caption: string
}

export interface AppEntry {
  /** URL-segment: /appar/<slug>. */
  slug: string
  /** Visningsnamn utan varumärkesprefix, t.ex. "Laga". */
  name: string
  /** Fullständigt namn i App Store/TestFlight. */
  fullName: string
  /** Kort citat som fångar problemet appen löser. */
  hook: string
  /** En rad under namnet på appkortet. */
  tagline: string
  /** Två–tre meningar överst på appsidan. */
  blurb: string
  status: AppStatus
  statusLabel: string
  /** CSS-klass som sätter appens accentfärg (se globals.css). */
  theme: 'theme-laga' | 'theme-gymma'
  /** Huvudknapp på kort och appsida. Saknas för appar som inte går att använda än. */
  primaryCta?: { href: string; label: string }
  /** Visa intresseanmälan ("hör av dig när appen släpps"). */
  waitlist: boolean
  features: AppFeature[]
  /** Punkter till appsidans integritetsavsnitt. Ska vara sanna och kontrollerbara. */
  privacy: string[]
  screenshots: AppScreenshot[]
  /** Vidare läsning, t.ex. Laga → den publika receptbanken. */
  related?: { href: string; label: string; text: string }
}

export const apps: AppEntry[] = [
  {
    slug: 'laga',
    name: 'Laga',
    fullName: 'VadSkaVi Laga',
    hook: 'Vad ska vi laga?',
    tagline: 'Familjens receptbok',
    blurb:
      'Internet är fullt av recept, men det är svårt att veta vilka som faktiskt blir bra. Laga vänder på det: receptboken byggs av familjen och vännerna, och varje rätt har lagats av någon du känner. Ingen anonym betygsdjungel — bara mat ni redan vet är värd att laga igen.',
    status: 'web',
    statusLabel: 'Finns i webbläsaren',
    theme: 'theme-laga',
    primaryCta: { href: '/register', label: 'Skapa konto' },
    waitlist: true,
    features: [
      {
        icon: Users,
        title: 'Recept från människor du känner',
        text: 'Mormors köttbullar, pappas raggmunkar. Ni samlar rätterna i en gemenskap med egen inbjudningskod — familjen, vännerna eller kollegorna.',
      },
      {
        icon: Sparkles,
        title: 'Klistra in, fota eller länka',
        text: 'Ett foto av en kokbokssida, en länk till en matblogg eller bara inklistrad text. Receptet struktureras åt dig — du behöver aldrig skriva av något.',
      },
      {
        icon: Heart,
        title: 'Laga-logg, betyg och kommentarer',
        text: 'Bocka av när du lagat, sätt betyg och lämna anteckningen som gör den bättre nästa gång. Med tiden vet ni vilka rätter som faktiskt håller.',
      },
      {
        icon: Timer,
        title: 'Lägescookning',
        text: 'Steg för steg med stora bokstäver, och skärmen slocknar inte mitt i. Telefonen kan ligga på bänken med smetiga händer i närheten.',
      },
      {
        icon: Search,
        title: 'Sök på svenska',
        text: 'Fulltextsök som förstår svensk böjning — sök på "köttbullar" och hitta receptet som heter "farmors köttbullar med gräddsås".',
      },
      {
        icon: BookOpen,
        title: 'Planera veckan',
        text: 'Välj veckans middagar ur receptboken i stället för att stå i affären och gissa.',
      },
    ],
    privacy: [
      'Din receptbok är privat för din gemenskap. Ingen utomstående kan läsa den, och den syns inte i sökmotorer.',
      'Uppgifterna lagras i en databas på en server i Europa. Vi säljer inga uppgifter och kör ingen annonsprofilering.',
      'När du klistrar in en text, en länk eller ett foto för att få det tolkat skickas det innehållet till vår AI-leverantör, som i dag finns i USA. Det är den enda delen av Laga som lämnar EU, och vi arbetar för att flytta även den.',
      'Du kan radera ditt konto direkt i appen. Dina personuppgifter anonymiseras då.',
    ],
    screenshots: [
      { file: 'laga-hem.png', alt: 'Lagas hemflöde med receptkort', caption: 'Hemflödet' },
      { file: 'laga-recept.png', alt: 'Ett recept med laga-logg och betyg', caption: 'Ett recept' },
      { file: 'laga-koklage.png', alt: 'Lägescookning steg för steg', caption: 'Lägescookning' },
    ],
    related: {
      href: '/recept',
      label: 'Bläddra bland recept',
      text: 'Vi publicerar också en öppen receptbank med några av våra egna favoriter — fritt att laga utan konto.',
    },
  },
  {
    slug: 'gymma',
    name: 'Gymma',
    fullName: 'Gymma',
    hook: 'Vad tog jag förra gången?',
    tagline: 'Träningsloggen för styrketräning',
    blurb:
      'Gymma är loggboken för dig som lyfter. Den kommer ihåg vad du tog förra gången och föreslår det direkt, så att ett set kostar ett tryck i stället för en stund med tangentbordet. Allt fungerar offline, och all data stannar på din telefon.',
    status: 'soon',
    statusLabel: 'Snart i App Store',
    theme: 'theme-gymma',
    waitlist: true,
    features: [
      {
        icon: Check,
        title: 'Ett tryck per set',
        text: 'Loggvyn är redan ifylld med förra passets vikt och reps. Blev det likadant i dag räcker det med att bekräfta.',
      },
      {
        icon: Hand,
        title: 'Aldrig tangentbord under passet',
        text: 'Bara stora plus och minus. Att skriva siffror mellan set med svettiga fingrar är inte träning, det är datainmatning.',
      },
      {
        icon: WifiOff,
        title: 'Fungerar helt offline',
        text: 'Gymkällare har usel täckning. Nät är en bonus i Gymma, aldrig ett krav — ingenting väntar på en uppkoppling.',
      },
      {
        icon: ListChecks,
        title: 'Programmet växer fram',
        text: 'Det finns ingen "skapa program"-vy. Maskiner läggs till när du använder dem, inte i förväg vid köksbordet.',
      },
      {
        icon: Smartphone,
        title: 'Tummen når allt',
        text: 'Allt du trycker på ligger i nedre tredjedelen av skärmen, med rejält tilltagna tryckytor.',
      },
      {
        icon: Battery,
        title: 'Följ upp utan pekpinnar',
        text: 'Månad mot snitt, veckans pass och nya rekord. Återkopplingen påstår bara sådant som är sant ur din egen data.',
      },
    ],
    privacy: [
      'All träningsdata ligger lokalt på din telefon, i appens egen databas.',
      'Ingen inloggning, inget konto, ingen molnsynk. Vi kan inte se din träning — inte ens om vi ville.',
      'Ingen delning och ingen jämförelse med andra. Loggboken är din, och bara din.',
      'Appen behöver inga nätverksrättigheter för att göra sitt jobb.',
    ],
    screenshots: [
      { file: 'gymma-start.png', alt: 'Gymmas startvy med veckoring', caption: 'Startvyn' },
      { file: 'gymma-logg.png', alt: 'Loggvyn med stora plus- och minusknappar', caption: 'Loggvyn' },
      { file: 'gymma-folj-upp.png', alt: 'Följ upp med månadsbrickor', caption: 'Följ upp' },
    ],
  },
]

/** Slår upp en app på dess URL-segment. Returnerar undefined för okänd slug. */
export function getApp(slug: string): AppEntry | undefined {
  return apps.find((a) => a.slug === slug)
}

/** Giltiga slugs — används av API-routen för att validera inkommande värden. */
export const appSlugs = apps.map((a) => a.slug)
