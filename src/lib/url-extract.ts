import { extractFromText, normalizeEntry, type ExtractedEntry } from '@/lib/ai'

/** Hämta ett recept från en URL: TikTok-oEmbed / JSON-LD Recipe / og-taggar / HTML→text→AI. */
export async function extractFromUrl(url: string): Promise<ExtractedEntry> {
  const hostname = new URL(url).hostname.toLowerCase()

  // TikTok: caption finns inte i HTML (bot-vägg) men i oEmbed
  if (hostname.endsWith('tiktok.com')) {
    const tt = await tiktokOEmbed(url)
    if (tt) return tt
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

async function tiktokOEmbed(url: string): Promise<ExtractedEntry | null> {
  try {
    const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VadSkaVi/1.0)' },
    })
    if (!r.ok) return null
    const o = (await r.json()) as { title?: string; author_name?: string }
    const text = [o.title, o.author_name].filter(Boolean).join('\n')
    if (!text.trim()) return null
    const result = await extractFromText(text)
    result.source = result.source || (o.author_name ? `TikTok (@${o.author_name})` : 'TikTok')
    result.url = result.url || url
    return result
  } catch {
    return null
  }
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
