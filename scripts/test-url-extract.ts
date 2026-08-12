/**
 * Fristående tester för de rena (nätverkslösa) funktionerna i src/lib/url-extract.ts.
 * Körs med `npm run test:url`. reza har ingen testrunner och behöver ingen för det här —
 * skriptet returnerar exit-kod 1 vid fel, så det kan wire:as in i CI om det känns värt det.
 */
import {
  decodeEntities,
  instagramCaptionFromEmbed,
  instagramShortcode,
  ogMeta,
} from '../src/lib/url-extract'

let failed = 0

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) {
    failed++
    console.error(`✗ ${name}\n    förväntat: ${JSON.stringify(expected)}\n    fick:      ${JSON.stringify(actual)}`)
  } else {
    console.log(`✓ ${name}`)
  }
}

function checkContains(name: string, haystack: string, needle: string) {
  if (!haystack.includes(needle)) {
    failed++
    console.error(`✗ ${name}\n    saknade: ${JSON.stringify(needle)}\n    i:       ${JSON.stringify(haystack.slice(0, 300))}`)
  } else {
    console.log(`✓ ${name}`)
  }
}

/* ---- Fixtur: den riktiga bildtexten från reel Db6oD4HA8pC (tre apostrofer) ---- */

const CAPTION_LINES = [
  '👨‍🍳Ingredients:',
  '3/4 cup dry breadcrumbs',
  '3/4 cup heavy cream',
  '2 eggs beaten',
  '2 tsp olive oil',
  '3 oz bacon diced',
  '2 cups finely diced onion',
  '1/4 cup finely diced bell pepper',
  "1/4 cup seeded and minced jalapeno's",
  '3 tbsp minced garlic',
  '1 tsp chopped fresh thyme',
  "1 tbsp Emeril's Original Essence (Cajun spice can substitute)",
  '1 tsp salt',
  '2 tsp black pepper',
  '1/2 tsp cayenne pepper',
  '1/4 cup chopped scallion',
  '2 tbsp chopped Italian Parsley',
  '1 1/2 pounds ground chuck',
]
const CAPTION_ONE_LINE = CAPTION_LINES.join(' ')

/* ---------------------------------------------------------------- ogMeta */

// Regressionen som orsakade buggen: en RÅ apostrof är helt giltig i ett dubbelciterat
// attribut, men `[^"']*` kapade värdet där. Här kapades ingredienslistan vid "jalapeno's".
const ogRaw = `<meta property="og:description" content="restovivaldi: ${CAPTION_ONE_LINE}" />`
checkContains('ogMeta: rå apostrof kapar inte bildtexten', ogMeta(ogRaw), 'ground chuck')
checkContains('ogMeta: rå apostrof behåller Emerils krydda', ogMeta(ogRaw), "Emeril's Original Essence")

// Samma bildtext med de två vanliga apostrof-kodningarna.
checkContains(
  'ogMeta: &#39; avkodas',
  ogMeta(ogRaw.replace(/'/g, '&#39;')),
  "1/4 cup seeded and minced jalapeno's",
)
checkContains(
  'ogMeta: &#039; avkodas (missades av gamla koden)',
  ogMeta(ogRaw.replace(/'/g, '&#039;')),
  "1 tbsp Emeril's Original Essence",
)

// Enkelciterat attribut som innehåller ett dubbelcitat — spegelvänt fall, samma bugg.
check(
  'ogMeta: enkelciterat attribut med dubbelcitat inuti',
  ogMeta(`<meta property='og:title' content='Mormors "bästa" bullar' />`),
  'Mormors "bästa" bullar',
)

// Attributordning: content före property.
check(
  'ogMeta: content före property',
  ogMeta(`<meta content="Pannkakor" property="og:title" />`),
  'Pannkakor',
)

check(
  'ogMeta: titel och beskrivning slås ihop',
  ogMeta(`<meta property="og:title" content="Bullar"><meta property="og:description" content="Med kardemumma">`),
  'Bullar\nMed kardemumma',
)

check('ogMeta: inga og-taggar ger tom sträng', ogMeta('<html><body>hej</body></html>'), '')

/* -------------------------------------------------------- decodeEntities */

check('decodeEntities: numeriska apostrofer', decodeEntities('Emeril&#39;s &#039;test&#039;'), "Emeril's 'test'")
check('decodeEntities: hex', decodeEntities('caf&#xe9;'), 'café')
check('decodeEntities: namngivna', decodeEntities('&quot;a&quot; &lt;b&gt; &amp; c'), '"a" <b> & c')
// &amp; måste avkodas SIST, annars blir &amp;#39; felaktigt en apostrof.
check('decodeEntities: &amp;#39; dubbelavkodas inte', decodeEntities('R&amp;#39;n'), "R&#39;n")

/* ---------------------------------------------------- instagramShortcode */

check(
  'shortcode: reel med igsh-parameter',
  instagramShortcode('https://www.instagram.com/reel/Db6oD4HA8pC/?igsh=MW9pejRiNm9yb2V4ZA=='),
  'Db6oD4HA8pC',
)
check('shortcode: /p/', instagramShortcode('https://instagram.com/p/ABC123_-x/'), 'ABC123_-x')
check('shortcode: /tv/', instagramShortcode('https://www.instagram.com/tv/XYZ789/'), 'XYZ789')
check('shortcode: /reels/', instagramShortcode('https://www.instagram.com/reels/Qq1/'), 'Qq1')
check(
  'shortcode: under användarnamn',
  instagramShortcode('https://www.instagram.com/restovivaldi/reel/Db6oD4HA8pC/'),
  'Db6oD4HA8pC',
)
check('shortcode: profil-URL ger null', instagramShortcode('https://www.instagram.com/restovivaldi/'), null)
check('shortcode: skräp ger null', instagramShortcode('inte-en-url'), null)

/* ------------------------------------------------ instagramCaptionFromEmbed */

// Caption-diven innehåller en NÄSTLAD div (UsernameText). En icke-girig </div>-matchning
// hade kapat allt efter användarnamnet — därför div-räkningen i divContent().
const embedDivHtml = `<!DOCTYPE html><html><body>
<div class="Embed">
  <div class="Caption">
    <a class="CaptionUsername" href="https://www.instagram.com/restovivaldi/"><div class="UsernameText">restovivaldi</div></a>
    <span class="CaptionComments">75 likes, 3 comments</span>
    ${CAPTION_LINES.map((l) => l.replace(/&/g, '&amp;').replace(/'/g, '&#039;')).join('<br>')}
  </div>
</div>
</body></html>`

const fromDiv = instagramCaptionFromEmbed(embedDivHtml)
checkContains('embed/div: hela listan med (nästlad div i Caption)', fromDiv?.caption ?? '', 'ground chuck')
checkContains('embed/div: apostrofer avkodade', fromDiv?.caption ?? '', "jalapeno's")
check('embed/div: användarnamn', fromDiv?.author, 'restovivaldi')
check('embed/div: användarnamnet läcker inte in i bildtexten', fromDiv?.caption.includes('restovivaldi'), false)
check('embed/div: kommentarsräknaren strippas', fromDiv?.caption.includes('75 likes'), false)
check('embed/div: radbrytningar bevaras', (fromDiv?.caption.match(/\n/g) ?? []).length, CAPTION_LINES.length - 1)

// JSON-varianten. Bildtexten innehåller klammer, som brace-räknaren måste hantera.
const jsonCaption = `${CAPTION_LINES.join('\n')}\n{obs: klammer i texten}`
const embedJsonHtml = `<!DOCTYPE html><html><body><script>window.__additionalDataLoaded('extra',${JSON.stringify(
  {
    shortcode_media: {
      owner: { username: 'restovivaldi' },
      edge_media_to_caption: { edges: [{ node: { text: jsonCaption } }] },
    },
  },
)});</script></body></html>`

const fromJson = instagramCaptionFromEmbed(embedJsonHtml)
checkContains('embed/json: bildtext hittad', fromJson?.caption ?? '', 'ground chuck')
checkContains('embed/json: klammer i texten bryter inte parsningen', fromJson?.caption ?? '', '{obs: klammer i texten}')
check('embed/json: användarnamn', fromJson?.author, 'restovivaldi')

// Längsta källan vinner när båda finns.
const both = instagramCaptionFromEmbed(
  embedJsonHtml.replace('</body>', `<div class="Caption">kort</div></body>`),
)
checkContains('embed: längsta källan vinner', both?.caption ?? '', 'ground chuck')

// Inloggningsvägg / tomt svar ⇒ null (anroparen kastar då ett tydligt fel).
check('embed: sida utan bildtext ger null', instagramCaptionFromEmbed('<html><body>Log in</body></html>'), null)

/* ------------------------------------------------------------------ slut */

if (failed > 0) {
  console.error(`\n${failed} test misslyckades.`)
  process.exit(1)
}
console.log('\nAlla tester gröna.')
