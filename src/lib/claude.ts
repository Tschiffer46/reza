import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ExtractedEntry {
  type: 'recipe' | 'tip'
  title: string
  category: string
  ingredients: string[]
  instructions: string | null
  content: string | null
  source: string | null
  url: string | null
}

const SYSTEM_PROMPT = `Du ar en receptextraherings-assistent. Analysera inmatningen och returnera strukturerad JSON.

Returnera EXAKT detta JSON-format, inget annat:
{
  "type": "recipe" eller "tip",
  "title": "kort titel",
  "category": "en av kategorierna nedan",
  "ingredients": ["array av ingredienser, bara for recept, tom array for tips"],
  "instructions": "instruktioner steg for steg, bara for recept, null for tips",
  "content": "innehall, bara for tips, null for recept",
  "source": "kalla om den framgar, annars null",
  "url": "URL om den syns i texten eller bilden, annars null"
}

Kategorier for recept: Huvudratt, Forratt, Efterratt, Bakning, Sallad, Soppa, Frukost, Snacks, Dryck
Kategorier for tips: Matlagning, Forvaring, Kryddor, Redskap, Ovrigt

Regler:
- Svara BARA med JSON, ingen annan text
- Valj den mest passande kategorin
- Om det ar ett recept, extrahera ingredienser och instruktioner
- Om det ar ett tips/rad/information, anvand type "tip" och fyll i content
- Skriv pa svenska
- Om det finns en URL synlig i texten eller bilden, inkludera den i url-faltet`

function parseResponse(text: string): ExtractedEntry {
  // Strip markdown code fences if present
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
    source: parsed.source || null,
    url: parsed.url || null,
  }
}

/** Extract structured data from text using Haiku (cheap + fast) */
export async function extractFromText(text: string): Promise<ExtractedEntry> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Oväntat svar från Claude')
  return parseResponse(content.text)
}

/** Extract structured data from image(s) using Sonnet (better vision) */
export async function extractFromImage(
  images: { base64: string; mediaType: string }[]
): Promise<ExtractedEntry> {
  const imageBlocks: Anthropic.ImageBlockParam[] = images.map((img) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      data: img.base64,
    },
  }))

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: 'Extrahera receptet eller tipset fran bilden/bilderna.' },
        ],
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Oväntat svar från Claude')
  return parseResponse(content.text)
}
