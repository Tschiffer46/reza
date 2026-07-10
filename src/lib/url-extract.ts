import { extractFromText, normalizeEntry, type ExtractedEntry } from '@/lib/ai'

/** Hämta ett recept från en URL: TikTok-caption / JSON-LD Recipe / og-taggar / HTML→text→AI. */
export async function extractFromUrl(url: string): Promise<ExtractedEntry> {
  const hostname = new URL(url).hostname.toLowerCase()

  // TikTok hanteras separat: videosidan är en JS-skal-/bot-sida utan läsbar text, så det
  // generella HTML-spåret nedan ger bara skräp ("TikTok - Make Your Day"). Misslyckas
  // caption-hämtningen ska användaren få ett tydligt fel — inte ett påhittat recept.
  if (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) {
    return extractTikTok(url)
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VadSkaVi/1.0)', Accept: 'text/html' },
  })
  const html = await response.text()

  const jsonLd = extractJsonLdRecipe(html)
  if (jsonLd) {
    jsonLd.source = jsonLd.source || hostname
    jsonLd.url = jsonLd.url || url
    return jsonLd
  }

  // og-taggar bär ofta receptet/captionen (Instagram, sociala sidor)
  const og = ogMeta(html)
  const plain = htmlToText(html)
  const text = og ? `${og}\n\n${plain}` : plain
  const result = await extractFromText(text)
  result.source = result.source || hostname
  result.url = result.url || url
  return result
}

/** Webbläsar-lik User-Agent — TikTok svarar med 403/bot-vägg på uppenbara bot-UA:er. */
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

interface TikTokCaption {
  caption: string
  author?: string
}

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
  return result
}

async function tiktokOEmbed(url: string): Promise<TikTokCaption | null> {
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
async function tiktokPageCaption(url: string): Promise<TikTokCaption | null> {
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
function findTikTokItem(data: unknown, depth = 0): TikTokCaption | null {
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

function ogMeta(html: string): string {
  const get = (prop: string) => {
    const m =
      html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i')) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'))
    return m ? m[1] : ''
  }
  return [get('og:title'), get('og:description')]
    .filter(Boolean)
    .join('\n')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
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
