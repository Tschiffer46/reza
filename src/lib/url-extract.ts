import { extractFromText, normalizeEntry, type ExtractedEntry } from '@/lib/ai'

/** Hämta ett recept från en URL: TikTok-/Instagram-caption / JSON-LD Recipe / og-taggar / HTML→text→AI. */
export async function extractFromUrl(url: string): Promise<ExtractedEntry> {
  const hostname = new URL(url).hostname.toLowerCase()

  // TikTok hanteras separat: videosidan är en JS-skal-/bot-sida utan läsbar text, så det
  // generella HTML-spåret nedan ger bara skräp ("TikTok - Make Your Day"). Misslyckas
  // caption-hämtningen ska användaren få ett tydligt fel — inte ett påhittat recept.
  if (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) {
    return extractTikTok(url)
  }

  // Instagram har samma problem: inläggssidan är en inloggningsvägg för server-anrop, och
  // og-taggarna bär bara en trunkerad bildtext. Receptet ligger i bildtexten ⇒ eget spår.
  if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) {
    return extractInstagram(url)
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VadSkaVi/1.0)', Accept: 'text/html' },
  })
  // Utan den här kollen matas en 4xx-/inloggningssida in i AI:n som om den vore innehåll.
  if (!response.ok) {
    throw new Error(
      `Kunde inte hämta sidan (HTTP ${response.status}). Kontrollera länken, eller kopiera ` +
        'receptet och klistra in det som text.',
    )
  }
  const html = await response.text()

  const jsonLd = extractJsonLdRecipe(html)
  if (jsonLd) {
    jsonLd.source = jsonLd.source || hostname
    jsonLd.url = jsonLd.url || url
    // Även strukturerad data kan vara ett skal (`@type: Recipe` utan ingredienser) — samma vakt.
    return requireSubstance(jsonLd)
  }

  // og-taggar bär ofta receptet/captionen (Instagram, sociala sidor)
  const og = ogMeta(html)
  const plain = htmlToText(html)
  const text = og ? `${og}\n\n${plain}` : plain
  const result = await extractFromText(text)
  result.source = result.source || hostname
  result.url = result.url || url
  return requireSubstance(result)
}

/** Webbläsar-lik User-Agent — TikTok svarar med 403/bot-vägg på uppenbara bot-UA:er. */
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

interface SocialCaption {
  caption: string
  author?: string
}

/**
 * En post utan både ingredienser och instruktioner — och utan tips-innehåll — bär inget recept.
 * `normalizeEntry()` har fallback för varje fält, så en total innehållsmiss returnerar annars ett
 * välformat TOMT recept som ser ut att ha lyckats. Bättre att fela tydligt: användaren får veta
 * varför och kan klistra in texten i stället.
 */
function requireSubstance(entry: ExtractedEntry, message?: string): ExtractedEntry {
  const hasRecipe = entry.ingredients.length > 0 || !!entry.instructions?.trim()
  const hasTip = !!entry.content?.trim()
  if (!hasRecipe && !hasTip) {
    throw new Error(
      message ||
        'Hittade inget recept på sidan — den kan kräva inloggning eller ladda innehållet med ' +
          'JavaScript. Kopiera receptet och klistra in det som text, eller ta en skärmdump.',
    )
  }
  return entry
}

/**
 * Avkoda HTML-entiteter i attribut/bildtexter. Numeriska entiteter först så att apostrof-varianterna
 * (`&#39;` OCH `&#039;`) täcks in — den gamla koden kollade bara `&#39;` och lät `&#039;` läcka
 * igenom som synlig text. `&amp;` avkodas SIST, annars blir `&amp;#39;` felaktigt en apostrof.
 */
export function decodeEntities(text: string): string {
  const codePoint = (raw: string, value: number) =>
    value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : raw

  return text
    .replace(/&#x([0-9a-f]+);/gi, (raw, hex) => codePoint(raw, parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (raw, dec) => codePoint(raw, parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/* ---------------------------------------------------------------- TikTok */

/**
 * TikTok: receptet ligger i videons bildtext (caption). Den hämtas från två källor
 * parallellt — oEmbed-API:ts `title` (kan vara trunkerad för långa captions) och
 * videosidans inbäddade JSON (hela captionen när sidan inte bot-väggas) — och den
 * längsta vinner. Kortlänkar (vm./vt.tiktok.com) följs via redirect av fetch.
 */
async function extractTikTok(url: string): Promise<ExtractedEntry> {
  const [oembed, page] = await Promise.all([tiktokOEmbed(url), tiktokPageCaption(url)])
  const caption =
    (page?.caption.length ?? 0) > (oembed?.caption.length ?? 0) ? page?.caption : oembed?.caption
  const author = oembed?.author || page?.author

  if (!caption?.trim()) {
    throw new Error(
      'Kunde inte hämta TikTok-videons bildtext — TikTok blockerar ibland hämtning från servrar. ' +
        'Öppna videon, kopiera bildtexten och klistra in den som text i stället.',
    )
  }

  const result = await extractFromText(
    author ? `${caption}\n\nKälla: TikTok (@${author})` : caption,
  )
  result.source = result.source || (author ? `TikTok (@${author})` : 'TikTok')
  result.url = result.url || url
  return requireSubstance(
    result,
    'Bildtexten innehöll inget recept. Öppna videon och kontrollera att receptet står i ' +
      'bildtexten — annars kan du ta en skärmdump av det.',
  )
}

async function tiktokOEmbed(url: string): Promise<SocialCaption | null> {
  try {
    const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': BROWSER_UA },
    })
    if (!r.ok) return null
    const o = (await r.json()) as { title?: string; author_name?: string }
    if (!o.title?.trim()) return null
    return { caption: o.title.trim(), author: o.author_name }
  } catch {
    return null
  }
}

/** Läs captionen ur videosidans server-renderade JSON (__UNIVERSAL_DATA_FOR_REHYDRATION__,
 *  äldre sidor: SIGI_STATE). Bot-vägg/captcha-sida saknar JSON:en ⇒ null. */
async function tiktokPageCaption(url: string): Promise<SocialCaption | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' } })
    if (!r.ok) return null
    const html = await r.text()
    for (const id of ['__UNIVERSAL_DATA_FOR_REHYDRATION__', 'SIGI_STATE']) {
      const m = html.match(new RegExp(`<script[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)</script>`, 'i'))
      if (!m) continue
      try {
        const item = findTikTokItem(JSON.parse(m[1]))
        if (item) return item
      } catch {
        // ogiltig JSON — prova nästa källa
      }
    }
    return null
  } catch {
    return null
  }
}

/** Leta upp video-objektet ({desc, author/nickname}) i TikTok:s state-träd, oavsett om det
 *  ligger under webapp.video-detail.itemInfo.itemStruct eller ItemModule (strukturen byter
 *  form mellan sidversioner — därför en tolerant djupsökning med djupgräns). */
function findTikTokItem(data: unknown, depth = 0): SocialCaption | null {
  if (!data || typeof data !== 'object' || depth > 6) return null
  const obj = data as Record<string, unknown>
  if (typeof obj.desc === 'string' && obj.desc.trim() && ('author' in obj || 'nickname' in obj)) {
    let author: string | undefined
    if (typeof obj.nickname === 'string') author = obj.nickname
    else if (obj.author && typeof obj.author === 'object') {
      const n = (obj.author as Record<string, unknown>).nickname
      if (typeof n === 'string') author = n
    } else if (typeof obj.author === 'string') author = obj.author
    return { caption: obj.desc.trim(), author }
  }
  for (const value of Object.values(obj)) {
    const found = findTikTokItem(value, depth + 1)
    if (found) return found
  }
  return null
}

/* ------------------------------------------------------------- Instagram */

const INSTAGRAM_NO_CAPTION =
  'Kunde inte hämta Instagram-inläggets bildtext — inlägget kan vara privat eller borttaget, ' +
  'eller så blockerar Instagram hämtning från servrar. Öppna inlägget, kopiera bildtexten och ' +
  'klistra in den som text i stället.'

/**
 * Instagram: receptet ligger i inläggets bildtext. Inläggssidan själv är en inloggningsvägg för
 * server-anrop, men **embed-vyn** (`/embed/captioned/`) är publik och bär hela bildtexten — det är
 * därför den används i stället för att skrapa inläggssidan. Två källor i embed-svaret provas
 * (inbäddad JSON + `Caption`-diven) och den längsta vinner, samma tolerans som TikTok-spåret.
 * og-taggarna på original-URL:en är sista utväg; de är ofta trunkerade men bättre än inget.
 */
async function extractInstagram(url: string): Promise<ExtractedEntry> {
  const shortcode = instagramShortcode(url)
  if (!shortcode) {
    throw new Error('Kunde inte läsa ut inläggs-id ur Instagram-länken. Kontrollera länken.')
  }

  // instagramEmbed() ger null om bildtexten saknas ⇒ og-taggarna provas bara när embed inte bar.
  const found = (await instagramEmbed(shortcode)) ?? (await instagramOg(url))
  if (!found?.caption.trim()) throw new Error(INSTAGRAM_NO_CAPTION)

  const { caption, author } = found
  const result = await extractFromText(
    author ? `${caption}\n\nKälla: Instagram (@${author})` : caption,
  )
  result.source = result.source || (author ? `Instagram (@${author})` : 'Instagram')
  result.url = result.url || url
  return requireSubstance(
    result,
    'Bildtexten innehöll inget recept. Öppna inlägget och kontrollera att receptet står i ' +
      'bildtexten — står det bara i videon kan du ta en skärmdump av det i stället.',
  )
}

/** Shortcode ur en Instagram-URL: /reel/, /reels/, /p/ eller /tv/ — även under ett användarnamn.
 *  Spårparametrar (`?igsh=…`) faller bort eftersom bara sökvägen läses. */
export function instagramShortcode(url: string): string | null {
  try {
    const m = new URL(url).pathname.match(/\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

async function instagramEmbed(shortcode: string): Promise<SocialCaption | null> {
  try {
    const r = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' },
    })
    if (!r.ok) return null
    return instagramCaptionFromEmbed(await r.text())
  } catch {
    return null
  }
}

/** Bildtexten ur embed-sidans HTML: inbäddad JSON och `Caption`-diven, längsta vinner. */
export function instagramCaptionFromEmbed(html: string): SocialCaption | null {
  const fromJson = instagramCaptionFromJson(html)
  const fromDiv = instagramCaptionFromDiv(html)
  const best = (fromJson?.caption.length ?? 0) >= (fromDiv?.caption.length ?? 0) ? fromJson : fromDiv
  if (!best?.caption.trim()) return null
  return { caption: best.caption.trim(), author: best.author || fromDiv?.author || fromJson?.author }
}

function instagramCaptionFromJson(html: string): SocialCaption | null {
  for (const marker of ['__additionalDataLoaded', 'gql_data', '__NEXT_DATA__']) {
    const raw = balancedJsonAfter(html, marker)
    if (!raw) continue
    try {
      const found = findInstagramCaption(JSON.parse(raw))
      if (found) return found
    } catch {
      // ogiltig JSON — prova nästa markör
    }
  }
  return null
}

/** Klipp ut ett balanserat JSON-objekt som börjar vid första `{` efter `marker`. Strängar och
 *  escape-sekvenser respekteras, så klammer inne i bildtexten inte räknas som struktur. */
function balancedJsonAfter(html: string, marker: string): string | null {
  const start = html.indexOf(marker)
  if (start === -1) return null
  const open = html.indexOf('{', start + marker.length)
  if (open === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = open; i < html.length; i++) {
    const ch = html[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) return html.slice(open, i + 1)
  }
  return null
}

/** Djupsökning efter bildtexten i embed-sidans state-träd (strukturen byter form mellan
 *  sidversioner — samma toleranta mönster som findTikTokItem). */
function findInstagramCaption(data: unknown, depth = 0): SocialCaption | null {
  if (!data || typeof data !== 'object' || depth > 8) return null
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findInstagramCaption(item, depth + 1)
      if (found) return found
    }
    return null
  }
  const obj = data as Record<string, unknown>

  const edges = (obj.edge_media_to_caption as { edges?: unknown[] } | undefined)?.edges
  if (Array.isArray(edges) && edges.length) {
    const node = (edges[0] as { node?: { text?: unknown } } | undefined)?.node
    if (node && typeof node.text === 'string' && node.text.trim()) {
      return { caption: node.text.trim(), author: instagramOwner(obj) }
    }
  }
  if (typeof obj.caption === 'string' && obj.caption.trim() && 'owner' in obj) {
    return { caption: obj.caption.trim(), author: instagramOwner(obj) }
  }

  for (const value of Object.values(obj)) {
    const found = findInstagramCaption(value, depth + 1)
    if (found) return found
  }
  return null
}

function instagramOwner(obj: Record<string, unknown>): string | undefined {
  const owner = obj.owner
  if (owner && typeof owner === 'object') {
    const username = (owner as Record<string, unknown>).username
    if (typeof username === 'string' && username.trim()) return username.trim()
  }
  return undefined
}

/** Bildtexten ur embed-sidans `<div class="Caption">`. Användarnamnet och kommentarsräknaren
 *  ligger i egna element inuti diven och plockas bort innan texten läses. */
function instagramCaptionFromDiv(html: string): SocialCaption | null {
  const inner = divContent(html, 'Caption')
  if (inner === null) return null

  const usernameMatch = inner.match(
    /class=["'][^"']*\bCaptionUsername\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
  )
  const author = usernameMatch ? stripTags(usernameMatch[1]) : undefined

  const caption = stripTags(
    inner
      .replace(/<a[^>]*class=["'][^"']*\bCaptionUsername\b[^"']*["'][\s\S]*?<\/a>/gi, ' ')
      .replace(/<span[^>]*class=["'][^"']*\bCaptionComments\b[^"']*["'][\s\S]*?<\/span>/gi, ' '),
  )
  return caption ? { caption, author: author || undefined } : null
}

/** Innehållet i en `<div>` vars class matchar, med hänsyn till nästlade div:ar (en icke-girig
 *  `</div>`-matchning skulle kapa vid den första nästlade diven — Caption-diven har flera). */
function divContent(html: string, className: string): string | null {
  const opening = html.match(
    new RegExp(`<div[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'i'),
  )
  if (!opening || opening.index === undefined) return null

  const start = opening.index + opening[0].length
  const tag = /<(\/?)div\b[^>]*>/gi
  tag.lastIndex = start
  let depth = 1
  let match: RegExpExecArray | null
  while ((match = tag.exec(html)) !== null) {
    depth += match[1] ? -1 : 1
    if (depth === 0) return html.slice(start, match.index)
  }
  return null
}

async function instagramOg(url: string): Promise<SocialCaption | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' } })
    if (!r.ok) return null
    const text = ogMeta(await r.text()).trim()
    if (!text) return null
    return { caption: text, author: text.match(/([A-Za-z0-9._]+)\s+on\s+Instagram/i)?.[1] }
  } catch {
    return null
  }
}

/* ------------------------------------------------------- generisk HTML */

export function ogMeta(html: string): string {
  // Bakreferens på citattecknet: bara det citattecken som ÖPPNADE attributet får avsluta det.
  // Ett `[^"']*` kapar värdet vid första apostrofen (helt giltig i ett dubbelciterat attribut) —
  // bildtexter är fulla av apostrofer, så ingredienslistor tappades tyst på mitten.
  const attr = String.raw`content=(["'])((?:(?!\1).)*)\1`
  const get = (prop: string) => {
    const m =
      html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+${attr}`, 'i')) ||
      html.match(new RegExp(`<meta[^>]+${attr}[^>]+(?:property|name)=["']${prop}["']`, 'i'))
    return m ? m[2] : ''
  }
  return decodeEntities([get('og:title'), get('og:description')].filter(Boolean).join('\n'))
}

function extractJsonLdRecipe(html: string): ExtractedEntry | null {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    try {
      const recipe = findRecipe(JSON.parse(match[1]))
      if (recipe) return recipeToEntry(recipe)
    } catch {
      // ogiltig JSON — hoppa över
    }
  }
  return null
}

function findRecipe(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findRecipe(item)
      if (r) return r
    }
    return null
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const type = obj['@type']
    const isRecipe = type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))
    if (isRecipe) return obj
    if (obj['@graph']) return findRecipe(obj['@graph'])
  }
  return null
}

function recipeToEntry(recipe: Record<string, unknown>): ExtractedEntry {
  let source: string | undefined
  const author = recipe.author
  if (typeof author === 'string') source = author
  else if (author && typeof author === 'object') {
    const n = (author as Record<string, unknown>).name
    if (typeof n === 'string') source = n
  }
  return normalizeEntry({
    type: 'recipe',
    title: typeof recipe.name === 'string' ? recipe.name : 'Utan titel',
    category: 'Huvudrätt',
    ingredients: toStringArray(recipe.recipeIngredient),
    instructions: parseInstructions(recipe.recipeInstructions),
    source,
  })
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  if (typeof v === 'string') return [v]
  return []
}

function parseInstructions(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) {
    const steps = v
      .map((step) => {
        if (typeof step === 'string') return step
        if (step && typeof step === 'object') {
          const o = step as Record<string, unknown>
          if (o['@type'] === 'HowToSection' && Array.isArray(o.itemListElement)) {
            return o.itemListElement
              .map((s) => (s && typeof s === 'object' ? (s as Record<string, unknown>).text : ''))
              .filter(Boolean)
              .join('\n')
          }
          return (o.text as string) || ''
        }
        return ''
      })
      .filter(Boolean)
    return steps.length ? steps.join('\n') : null
  }
  return null
}

/** Taggar bort och text ut — delad av caption-parsningen och HTML-fallbacken. */
function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(nav|header|footer)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
    .slice(0, 8000)
}
