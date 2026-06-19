/**
 * Statiskt, publikt receptinnehåll för den SEO-/affiliate-indexerade ytan
 * (`/recept` + `/recept/[slug]`). Helt SSG — ingen DB, ingen risk att läcka
 * privata familjerecept. Detta är innehållet som gör Adtraction-kanalen godkänd.
 *
 * Lägg gärna till riktiga foton: spara en `.webp` i `public/img/recept/` och sätt
 * `image`-fältet till filnamnet. Saknas foto visas ett varumärkt receptkort.
 */
export interface PublicRecipe {
  slug: string
  title: string
  category: string
  /** Kort intro med tillitsvinkeln: vem i familjen receptet kommer ifrån. */
  intro: string
  timeMinutes: number
  servings: number
  ingredients: string[]
  steps: string[]
  /** Filnamn i `public/img/recept/`, t.ex. `farmors-kottbullar.webp`. Valfritt. */
  image?: string
}

export const recipes: PublicRecipe[] = [
  {
    slug: 'farmors-kottbullar',
    title: 'Farmors köttbullar',
    category: 'Huvudrätt',
    intro:
      'Receptet kommer från farmor och har stått på söndagsbordet i tre generationer. Hemligheten är att låta ströbrödet svälla ordentligt och att steka i riktigt smör.',
    timeMinutes: 45,
    servings: 4,
    ingredients: [
      '500 g blandfärs',
      '1 gul lök, finhackad',
      '1 dl ströbröd',
      '2 dl mjölk',
      '1 ägg',
      '1 tsk salt',
      '0,5 tsk svartpeppar',
      '1 krm malen kryddpeppar',
      'smör till stekning',
    ],
    steps: [
      'Blanda ströbröd och mjölk i en bunke och låt svälla i 10 minuter.',
      'Fräs den hackade löken mjuk i lite smör och låt svalna.',
      'Rör ner färs, ägg, lök och kryddor i ströbrödsblandningen och arbeta smeten slät.',
      'Stek en liten provköttbulle, smaka av och justera saltet.',
      'Forma köttbullar med hjälp av två skedar eller fuktade händer.',
      'Stek i rikligt med smör på medelvärme tills de är gyllene och genomstekta, 8–10 minuter. Skaka pannan så de blir runda.',
      'Servera med kokt potatis, gräddsås, lingon och pressgurka.',
    ],
  },
  {
    slug: 'janssons-frestelse',
    title: 'Janssons frestelse',
    category: 'Huvudrätt',
    intro:
      'Julbordets självklara mittpunkt hemma hos oss. En krämig potatisgratäng med ansjovis som blir bäst om potatisen skärs riktigt tunt.',
    timeMinutes: 60,
    servings: 4,
    ingredients: [
      '8–10 fasta potatisar',
      '2 gula lökar',
      '1 burk ansjovis (ca 125 g)',
      '3 dl vispgrädde',
      '2 msk ströbröd',
      '2 msk smör',
      'vitpeppar',
    ],
    steps: [
      'Sätt ugnen på 225°C.',
      'Skala och skär potatisen i tunna stavar.',
      'Skala och skiva löken tunt och fräs den mjuk och blank i lite smör.',
      'Smörj en ugnsform och varva potatis, lök och ansjovis. Börja och sluta med potatis.',
      'Häll över halva grädden samt lite av ansjovisspadet och krydda med vitpeppar.',
      'Strö över ströbröd och klicka smör ovanpå.',
      'Grädda mitt i ugnen ca 45 minuter. Häll på resten av grädden efter halva tiden så den inte torkar ut.',
      'Janssons är klar när potatisen är mjuk och ytan gyllenbrun.',
    ],
  },
  {
    slug: 'artsoppa-med-flask',
    title: 'Ärtsoppa med fläsk',
    category: 'Soppa',
    intro:
      'Torsdagens klassiker, precis som mormor lagade den. Blötlägg ärterna kvällen innan så blir soppan len och fyllig.',
    timeMinutes: 120,
    servings: 6,
    ingredients: [
      '5 dl torkade gula ärter',
      '1,5 liter vatten',
      '400 g rimmat fläsk eller fläsklägg',
      '1 gul lök',
      '1 tsk torkad timjan eller mejram',
      'salt och peppar',
      'senap till servering',
    ],
    steps: [
      'Blötlägg ärterna i rikligt med vatten över natten och häll sedan av.',
      'Lägg ärterna i en stor gryta med 1,5 liter vatten och koka upp. Skumma av skalen som flyter upp.',
      'Lägg i hel skalad lök, fläsk och timjan. Sjud under lock ca 1,5 timme tills ärterna är mjuka.',
      'Ta upp fläsket, skär i bitar och lägg tillbaka i soppan.',
      'Smaka av med salt och peppar.',
      'Servera med senap, knäckebröd och gärna en varm punsch.',
    ],
  },
  {
    slug: 'raggmunkar-med-stekt-flask',
    title: 'Raggmunkar med stekt fläsk',
    category: 'Huvudrätt',
    intro:
      'Pappas favorit på fredagar. Riv potatisen direkt ner i smeten så hinner den inte mörkna, och stek raggmunkarna gyllene i smör.',
    timeMinutes: 40,
    servings: 4,
    ingredients: [
      '800 g fast potatis',
      '3 dl mjölk',
      '1,5 dl vetemjöl',
      '2 ägg',
      '1 tsk salt',
      '300 g rimmat sidfläsk i skivor',
      'smör till stekning',
      'lingonsylt till servering',
    ],
    steps: [
      'Vispa ihop mjöl, salt, ägg och mjölk till en slät smet och låt vila 10 minuter.',
      'Stek fläskskivorna knapriga i en torr panna och håll varmt.',
      'Skala och riv potatisen grovt, direkt ner i smeten, och rör om.',
      'Stek raggmunkar i smör, ca 3 minuter per sida, tills de är gyllene och genomstekta.',
      'Servera raggmunkarna direkt med det stekta fläsket och rikligt med lingon.',
    ],
  },
  {
    slug: 'kaldolmar-med-graddsas',
    title: 'Kåldolmar med gräddsås',
    category: 'Huvudrätt',
    intro:
      'Söndagsmat som tar lite tid men är värd varje minut. Penslingen med sirap ger dolmarna sin gyllene yta.',
    timeMinutes: 90,
    servings: 4,
    ingredients: [
      '1 vitkålshuvud',
      '400 g blandfärs',
      '1 dl kokt, kallt ris',
      '1 dl mjölk',
      '1 ägg',
      '1 tsk salt',
      'peppar',
      '2 msk sirap',
      'smör',
      '3 dl grädde + buljong till såsen',
    ],
    steps: [
      'Sätt ugnen på 200°C och skär bort den grova stocken ur kålhuvudet.',
      'Koka kålhuvudet i lättsaltat vatten ca 10 minuter. Lossa bladen efterhand och låt rinna av.',
      'Blanda färs, ris, mjölk, ägg, salt och peppar till en smet.',
      'Lägg en klick färssmet på varje kålblad och rulla ihop till paket. Vik in kanterna.',
      'Bryn dolmarna i smör med skarven nedåt och lägg dem i en ugnsform.',
      'Pensla med sirap och stek i ugnen ca 30 minuter, ös någon gång.',
      'Häll skyn i en kastrull och koka ihop med grädden till en sås. Smaka av.',
      'Servera kåldolmarna med kokt potatis, gräddsås och lingon.',
    ],
  },
  {
    slug: 'ugnsbakad-lax-med-dillstuvad-potatis',
    title: 'Ugnsbakad lax med dillstuvad potatis',
    category: 'Huvudrätt',
    intro:
      'En vardagsmiddag som känns som fest. Den skonsamt ugnsbakade laxen blir saftig och dillstuvningen håller ihop måltiden.',
    timeMinutes: 45,
    servings: 4,
    ingredients: [
      '600 g laxfilé',
      '1 citron',
      'salt och peppar',
      '800 g fast potatis',
      '3 dl mjölk',
      '2 msk smör',
      '2 msk vetemjöl',
      '1 kruka dill',
    ],
    steps: [
      'Sätt ugnen på 175°C. Lägg laxen i en smord form, salta, peppra och pressa över lite citron.',
      'Baka laxen i ugnen ca 20 minuter tills den precis går att dela.',
      'Skala och koka potatisen mjuk i lättsaltat vatten och häll av.',
      'Smält smöret i en kastrull, rör i mjölet och späd med mjölken under vispning till en slät sås. Låt koka 3–4 minuter.',
      'Vänd ner den kokta potatisen och rikligt med hackad dill. Smaka av med salt och peppar.',
      'Servera laxen med den dillstuvade potatisen och en citronklyfta.',
    ],
  },
  {
    slug: 'pannkakor-med-sylt',
    title: 'Pannkakor med sylt',
    category: 'Efterrätt',
    intro:
      'Barnens favorit och en självklar avslutning på ärtsoppan. Låt smeten vila en stund så blir pannkakorna mjukare.',
    timeMinutes: 30,
    servings: 4,
    ingredients: [
      '3 dl vetemjöl',
      '6 dl mjölk',
      '3 ägg',
      '0,5 tsk salt',
      '2 msk smält smör',
      'smör till stekning',
    ],
    steps: [
      'Vispa mjöl med hälften av mjölken till en slät smet utan klumpar.',
      'Vispa ner resten av mjölken, äggen, saltet och det smälta smöret.',
      'Låt smeten vila 15 minuter.',
      'Stek tunna pannkakor i smör i het stekpanna, gyllene på båda sidor.',
      'Servera med sylt och gärna vispad grädde.',
    ],
  },
  {
    slug: 'kanelbullar',
    title: 'Kanelbullar',
    category: 'Bak',
    intro:
      'Fikabrödet framför andra. Generöst med kardemumma i degen och riktig kanelfyllning är vad som gör mormors bullar oslagbara.',
    timeMinutes: 150,
    servings: 30,
    ingredients: [
      '50 g jäst',
      '5 dl mjölk',
      '150 g smör',
      '1,5 dl socker',
      '1 tsk salt',
      '2 tsk stött kardemumma',
      'ca 15 dl vetemjöl',
      'Fyllning: 100 g rumsvarmt smör',
      'Fyllning: 1 dl socker',
      'Fyllning: 2 msk kanel',
      'Pensling: 1 ägg',
      'Pensling: pärlsocker',
    ],
    steps: [
      'Smält smöret och häll i mjölken. Värm till fingervarmt (37°C).',
      'Smula jästen i en bunke och rör ut den med lite av vätskan. Tillsätt resten.',
      'Tillsätt socker, salt, kardemumma och det mesta av mjölet. Arbeta degen smidig i ca 10 minuter.',
      'Låt jäsa under bakduk ca 40 minuter tills den är dubbelt så stor.',
      'Rör ihop smör, socker och kanel till fyllningen.',
      'Kavla ut degen till en rektangel, bred på fyllningen, vik och skär i remsor. Snurra till bullar och lägg i formar.',
      'Låt jäsa ytterligare 30 minuter. Sätt ugnen på 225°C.',
      'Pensla med uppvispat ägg och strö över pärlsocker.',
      'Grädda mitt i ugnen 8–10 minuter tills gyllene. Låt svalna under bakduk.',
    ],
  },
  {
    slug: 'mormors-appelkaka',
    title: 'Mormors äppelkaka med vaniljsås',
    category: 'Efterrätt',
    intro:
      'En snabb smulkaka på syrliga äpplen som mormor gjorde när det fanns oväntade gäster. Bäst ljummen med kall vaniljsås.',
    timeMinutes: 50,
    servings: 6,
    ingredients: [
      '4–5 syrliga äpplen',
      '100 g smör',
      '2 dl ströbröd',
      '1 dl socker',
      '1 tsk kanel',
      'vaniljsås till servering',
    ],
    steps: [
      'Sätt ugnen på 200°C. Skala, kärna ur och skiva äpplena.',
      'Smält smöret i en stekpanna och rör i ströbröd, socker och kanel. Fräs tills smulorna blir gyllene.',
      'Varva smörgryn och äppelskivor i en smord ugnsform, börja och sluta med smulor.',
      'Grädda ca 25 minuter tills äpplena är mjuka och ytan knaprig.',
      'Servera ljummen med kall vaniljsås.',
    ],
  },
  {
    slug: 'toscakaka',
    title: 'Toscakaka',
    category: 'Bak',
    intro:
      'Den gyllene mandeltäckta kakan som alltid tar slut först på kalas. Toscan ska få bubbla till sig i ugnen tills den karamelliserar.',
    timeMinutes: 50,
    servings: 10,
    ingredients: [
      'Kaka: 2 ägg',
      'Kaka: 2 dl socker',
      'Kaka: 2 dl vetemjöl',
      'Kaka: 1 tsk bakpulver',
      'Kaka: 50 g smör',
      'Kaka: 0,5 dl mjölk',
      'Tosca: 50 g smör',
      'Tosca: 1 dl socker',
      'Tosca: 2 msk mjölk',
      'Tosca: 1 msk vetemjöl',
      'Tosca: 2 dl mandelspån',
    ],
    steps: [
      'Sätt ugnen på 175°C. Smörj och bröa en form på ca 24 cm.',
      'Vispa ägg och socker pösigt. Blanda mjöl och bakpulver och vänd ner.',
      'Smält smöret, rör i mjölken och vänd ner i smeten. Häll i formen.',
      'Grädda kakan i nedre delen av ugnen ca 20 minuter.',
      'Koka under tiden ihop alla ingredienser till toscan i en kastrull tills den tjocknar.',
      'Bred toscan över kakan och höj ugnen till 200°C. Grädda ytterligare 8–10 minuter tills ytan är gyllenbrun.',
      'Låt svalna i formen.',
    ],
  },
]

export function getAllRecipes(): PublicRecipe[] {
  return recipes
}

export function getRecipeBySlug(slug: string): PublicRecipe | undefined {
  return recipes.find((r) => r.slug === slug)
}

/** Minuter → läsbar svensk tidsangivelse, t.ex. "1 tim 30 min". */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} tim`
  return `${h} tim ${m} min`
}

/** Minuter → ISO 8601-varaktighet för schema.org, t.ex. "PT1H30M". */
export function isoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `PT${h > 0 ? `${h}H` : ''}${m > 0 ? `${m}M` : ''}` || 'PT0M'
}
