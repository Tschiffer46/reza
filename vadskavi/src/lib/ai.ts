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
