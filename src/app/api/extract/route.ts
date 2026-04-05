import { NextRequest, NextResponse } from 'next/server'
import { extractFromText, extractFromImage, ExtractedEntry } from '@/lib/claude'
import { readImage } from '@/lib/images'
import { prepareForClaude } from '@/lib/images'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { text, imageFilenames, url } = body

  try {
    // Text extraction
    if (text) {
      const result = await extractFromText(text)
      return NextResponse.json(result)
    }

    // Image extraction
    if (imageFilenames && imageFilenames.length > 0) {
      const images: { base64: string; mediaType: string }[] = []

      for (const filename of imageFilenames.slice(0, 3)) {
        const buffer = await readImage(filename)
        if (buffer) {
          const prepared = await prepareForClaude(buffer)
          images.push(prepared)
        }
      }

      if (images.length === 0) {
        return NextResponse.json({ error: 'Inga bilder hittades' }, { status: 400 })
      }

      const result = await extractFromImage(images)
      return NextResponse.json(result)
    }

    // URL extraction
    if (url) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Reza/1.0)',
          'Accept': 'text/html',
        },
      })
      if (!response.ok) {
        return NextResponse.json({ error: 'Kunde inte hämta URL:en' }, { status: 400 })
      }

      const html = await response.text()

      // 1. Try JSON-LD Recipe schema first — structured data, no AI needed
      const jsonLdResult = extractJsonLdRecipe(html)
      if (jsonLdResult) {
        jsonLdResult.source = jsonLdResult.source || new URL(url).hostname
        jsonLdResult.url = jsonLdResult.url || url
        return NextResponse.json(jsonLdResult)
      }

      // 2. Fallback: better HTML→text conversion, then AI extraction
      const plainText = htmlToStructuredText(html)
      const result = await extractFromText(plainText)
      result.source = result.source || new URL(url).hostname
      result.url = result.url || url
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Skicka text, bilder eller URL' }, { status: 400 })
  } catch (error) {
    console.error('Extract error:', error)
    const message = error instanceof Error ? error.message : 'Extraheringen misslyckades'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Extract Recipe from JSON-LD structured data (schema.org) */
function extractJsonLdRecipe(html: string): ExtractedEntry | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      const recipe = findRecipeInJsonLd(data)
      if (recipe) return recipeSchemaToEntry(recipe)
    } catch {
      // Invalid JSON, skip
    }
  }
  return null
}

/** Recursively find a Recipe object in JSON-LD (can be nested in @graph) */
function findRecipeInJsonLd(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item)
      if (found) return found
    }
    return null
  }

  const obj = data as Record<string, unknown>

  // Check @type
  const type = obj['@type']
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
    return obj
  }

  // Check @graph array
  if (Array.isArray(obj['@graph'])) {
    return findRecipeInJsonLd(obj['@graph'])
  }

  return null
}

/** Convert schema.org Recipe to our ExtractedEntry format */
function recipeSchemaToEntry(recipe: Record<string, unknown>): ExtractedEntry {
  // Ingredients
  const rawIngredients = recipe.recipeIngredient
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients.map((i) => String(i).trim())
    : []

  // Instructions — can be string, array of strings, or array of HowToStep/HowToSection
  let instructions = ''
  const rawInstructions = recipe.recipeInstructions
  if (typeof rawInstructions === 'string') {
    instructions = rawInstructions
  } else if (Array.isArray(rawInstructions)) {
    instructions = rawInstructions
      .map((step, i) => {
        if (typeof step === 'string') return `${i + 1}. ${step}`
        if (step && typeof step === 'object') {
          const s = step as Record<string, unknown>
          // HowToSection with itemListElement
          if (s['@type'] === 'HowToSection' && Array.isArray(s.itemListElement)) {
            const sectionName = s.name ? `${s.name}:\n` : ''
            const sectionSteps = (s.itemListElement as Record<string, unknown>[])
              .map((sub, j) => `${j + 1}. ${sub.text || sub.name || ''}`)
              .join('\n')
            return sectionName + sectionSteps
          }
          // HowToStep
          return `${i + 1}. ${s.text || s.name || ''}`
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  // Category guess based on recipeCategory
  const recipeCategory = recipe.recipeCategory
  const categoryStr = Array.isArray(recipeCategory)
    ? recipeCategory[0]
    : typeof recipeCategory === 'string'
      ? recipeCategory
      : ''
  const category = mapCategory(String(categoryStr)) || 'Huvudrätt'

  return {
    type: 'recipe',
    title: String(recipe.name || 'Utan titel').trim(),
    category,
    ingredients,
    instructions: instructions || null,
    content: null,
    source: null,
    url: null,
  }
}

/** Map schema.org recipeCategory to our categories */
function mapCategory(cat: string): string {
  const lower = cat.toLowerCase()
  const mapping: [string[], string][] = [
    [['förrätt', 'starter', 'appetizer'], 'Förrätt'],
    [['efterrätt', 'dessert'], 'Efterrätt'],
    [['bakning', 'bak', 'bröd', 'kaka', 'baking'], 'Bakning'],
    [['sallad', 'salad'], 'Sallad'],
    [['soppa', 'soup'], 'Soppa'],
    [['frukost', 'breakfast', 'brunch'], 'Frukost'],
    [['snacks', 'mellanmål', 'snack', 'tilltugg'], 'Snacks'],
    [['dryck', 'drink', 'smoothie'], 'Dryck'],
    [['huvudrätt', 'main', 'middag', 'lunch', 'dinner'], 'Huvudrätt'],
  ]
  for (const [keywords, name] of mapping) {
    if (keywords.some((kw) => lower.includes(kw))) return name
  }
  return ''
}

/** Convert HTML to structured plain text, preserving lists and paragraphs */
function htmlToStructuredText(html: string): string {
  let text = html

  // Remove non-content elements
  text = text.replace(/<(script|style|nav|header|footer|noscript|iframe|svg)[^>]*>[\s\S]*?<\/\1>/gi, '')

  // Add line breaks before block elements
  text = text.replace(/<\/?(p|div|br|h[1-6]|tr|blockquote|section|article)[^>]*\/?>/gi, '\n')

  // Convert list items to structured text
  text = text.replace(/<li[^>]*>/gi, '\n• ')
  text = text.replace(/<\/li>/gi, '')

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/&\w+;/g, '')

  // Collapse multiple spaces on same line, but preserve line breaks
  text = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')

  // Collapse more than 2 consecutive blank lines
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim().slice(0, 8000)
}
