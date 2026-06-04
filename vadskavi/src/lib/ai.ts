import Anthropic from '@anthropic-ai/sdk'

/**
 * Anthropic-konfiguration för VadSkaVi (förberedd för senare sprintar).
 *
 * Token-optimering enligt spec:
 *  - Haiku för textextraktion (snabb/billig), Sonnet för bildextraktion (bättre vision)
 *  - max_tokens: 800
 *  - Systemprompt på svenska
 *
 * Mönster portat från Reza (src/lib/claude.ts). Anropas ännu inte i Sprint 1.
 */

export const AI_MODELS = {
  /** Textextraktion — snabb och billig. */
  text: 'claude-haiku-4-5-20251001',
  /** Bildextraktion — bättre på vision. */
  image: 'claude-sonnet-4-20250514',
} as const

export const AI_MAX_TOKENS = 800

export const AI_SYSTEM_PROMPT = `Du är en receptextraherings-assistent för en svensk familjereceptbok.
Analysera inmatningen (text eller bild) och returnera strukturerad JSON.

Returnera EXAKT detta JSON-format, inget annat:
{
  "type": "recipe" eller "tip",
  "title": "kort titel",
  "category": "en av kategorierna nedan",
  "ingredients": ["array av ingredienser, bara för recept, tom array för tips"],
  "instructions": "instruktioner steg för steg, bara för recept, null för tips",
  "content": "innehåll, bara för tips, null för recept",
  "drinks": "förslag på dryck som passar, annars null",
  "source": "källa om den framgår, annars null",
  "url": "URL om den syns i texten eller bilden, annars null"
}

Kategorier för recept: Huvudrätt, Förrätt, Efterrätt, Bakning, Sallad, Soppa, Frukost, Snacks, Dryck
Kategorier för tips: Matlagning, Förvaring, Kryddor, Redskap, Övrigt

Regler:
- Svara BARA med giltig JSON, ingen annan text.
- Använd svenska i all extraherad text.
- Gissa rimlig kategori om den inte uttryckligen anges.`

let client: Anthropic | null = null

/** Lazy singleton — instansieras först vid första anropet (kräver ANTHROPIC_API_KEY). */
export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY saknas')
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

export interface ExtractedEntry {
  type: 'recipe' | 'tip'
  title: string
  category: string
  ingredients: string[]
  instructions: string | null
  content: string | null
  drinks: string | null
  source: string | null
  url: string | null
}

/** Parsa Claudes JSON-svar (stripa ev. markdown-fence) till ett ExtractedEntry. */
function parseResponse(text: string): ExtractedEntry {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }
  const parsed = JSON.parse(cleaned)
  return {
    type: parsed.type === 'tip' ? 'tip' : 'recipe',
    title: parsed.title || 'Utan titel',
    category: parsed.category || 'Övrigt',
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
    instructions: parsed.instructions || null,
    content: parsed.content || null,
    drinks: parsed.drinks || null,
    source: parsed.source || null,
    url: parsed.url || null,
  }
}

/** Textextraktion — Haiku (snabb/billig). */
export async function extractFromText(text: string): Promise<ExtractedEntry> {
  const response = await getAnthropic().messages.create({
    model: AI_MODELS.text,
    max_tokens: AI_MAX_TOKENS,
    system: AI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  })
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Oväntat svar från Claude')
  return parseResponse(block.text)
}

/** Bildextraktion — Sonnet (bättre vision). Bilder som base64 (input-only). */
export async function extractFromImage(
  images: { base64: string; mediaType: string }[],
): Promise<ExtractedEntry> {
  const imageBlocks: Anthropic.ImageBlockParam[] = images.map((img) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      data: img.base64,
    },
  }))

  const response = await getAnthropic().messages.create({
    model: AI_MODELS.image,
    max_tokens: AI_MAX_TOKENS,
    system: AI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: 'Extrahera receptet eller tipset från bilden/bilderna.' },
        ],
      },
    ],
  })
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Oväntat svar från Claude')
  return parseResponse(block.text)
}
