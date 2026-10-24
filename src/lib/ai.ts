import Anthropic from '@anthropic-ai/sdk'
import { PROTEIN_PROMPT_LIST, normalizeProtein, type Protein } from '@/lib/protein'

/**
 * Anthropic-konfiguration för VadSkaVi.
 *
 * Token-optimering enligt spec:
 *  - Haiku för textextraktion (snabb/billig), Sonnet 5.5 för bildextraktion (bättre vision)
 *  - max_tokens: 1500
 *  - Systemprompt på svenska
 */

export const AI_MODELS = {
  /** Textextraktion — snabb och billig. */
  text: 'claude-haiku-5-5',
  /** Bildextraktion — bättre på vision. (Sonnet 4.0 är pensionerad — håll denna aktuell.) */
  image: 'claude-sonnet-5-5',
} as const

/** Tak för genererad JSON (betalas per genererad token, inte per tak). Sonnet 5:s tokenizer
 *  ger ~30 % fler tokens än Sonnet 4 för samma text — 800 riskerade trunkerad JSON. */
export const AI_MAX_TOKENS = 1500

export const AI_SYSTEM_PROMPT = `Du är en receptextraherings-assistent för en svensk receptbok.
Analysera inmatningen (text eller bild) och returnera strukturerad JSON.

Returnera EXAKT detta JSON-format, inget annat:
{
  "type": "recipe" eller "tip",
  "title": "kort titel",
  "category": "en av kategorierna nedan",
  "ingredients": ["array av ingredienser, bara för recept, tom array för tips"],
  "instructions": "instruktioner steg för steg med VARJE steg på egen rad (radbrytning \\n mellan stegen), bara för recept, null för tips",
  "content": "innehåll, bara för tips, null för recept",
  "drinks": "förslag på dryck som passar, annars null",
  "source": "källa om den framgår, annars null",
  "url": "URL om den syns i texten eller bilden, annars null",
  "protein": "huvudprotein, en av nycklarna nedan, eller null"
}

Kategorier för recept: Huvudrätt, Förrätt, Efterrätt, Bakning, Sallad, Soppa, Frukost, Snacks, Dryck
Kategorier för tips: Matlagning, Förvaring, Kryddor, Redskap, Övrigt

Huvudprotein ("protein"): ${PROTEIN_PROMPT_LIST}.
- Ange det dominerande proteinet i huvudrätten. Lamm och vilt ⇒ "other".
- "vegetarian" = inget kött eller fisk, men mejeri/ägg kan finnas. "vegan" = inga animaliska produkter alls.
- Tips och sådant som inte är recept ⇒ null. Är du osäker ⇒ null.

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
  protein: Protein | null
}

/**
 * Säkerställ radbrytning mellan instruktionssteg. Källor som Instagram ger ofta
 * instruktioner på en enda rad ("1. … 2. … 3. …"); lägg då radbrytning före varje
 * numrerat steg så de renderas styckevis.
 */
function formatInstructions(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text) return null
  if (text.includes('\n')) return text
  return text.replace(/\s+(?=\d{1,2}[.)]\s)/g, '\n').trim()
}

/** Strippa ev. markdown-fence från ett JSON-svar. */
function stripFences(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }
  return cleaned
}

/** Normalisera ett parsat objekt till ett ExtractedEntry med fallback-värden. */
export function normalizeEntry(parsed: Record<string, unknown>): ExtractedEntry {
  return {
    type: parsed.type === 'tip' ? 'tip' : 'recipe',
    title: (parsed.title as string) || 'Utan titel',
    category: (parsed.category as string) || 'Övrigt',
    ingredients: Array.isArray(parsed.ingredients) ? (parsed.ingredients as string[]) : [],
    instructions: formatInstructions(parsed.instructions),
    content: (parsed.content as string) || null,
    drinks: (parsed.drinks as string) || null,
    source: (parsed.source as string) || null,
    url: (parsed.url as string) || null,
    protein: normalizeProtein(parsed.protein),
  }
}

/** Parsa Claudes JSON-svar till ett ExtractedEntry. */
/**
 * Texten ur ett svar. Ta ALDRIG `content[0]`: 5.5-modellerna tänker som standard och lägger då ett
 * (tomt) thinking-block först. Det var exakt så receptolkningen gick sönder efter modellbytet —
 * varje svar började med ett thinking-block och gav "Oväntat svar från Claude".
 */
export function responseText(response: {
  content: ReadonlyArray<{ type: string; text?: string }>
  stop_reason?: string | null
}): string {
  if (response.stop_reason === 'refusal') throw new Error('Claude avböjde att tolka innehållet')
  const block = response.content.find((b) => b.type === 'text' && typeof b.text === 'string')
  if (!block?.text) throw new Error('Oväntat svar från Claude')
  // Avklippt JSON går inte att tolka; säg varför i stället för ett obegripligt parse-fel.
  if (response.stop_reason === 'max_tokens') throw new Error('Svaret från Claude blev avklippt')
  return block.text
}

function parseResponse(text: string): ExtractedEntry {
  return normalizeEntry(JSON.parse(stripFences(text)))
}

const BATCH_SYSTEM_PROMPT = `${AI_SYSTEM_PROMPT}

Inmatningen kan innehålla FLERA recept eller tips. Returnera en JSON-ARRAY med ett objekt per recept/tips, i exakt samma objektformat som ovan. Svara BARA med JSON-arrayen.`

/** Batch-extraktion — flera recept/tips ur en text (Haiku). */
export async function extractBatchFromText(text: string): Promise<ExtractedEntry[]> {
  const response = await getAnthropic().messages.create({
    model: AI_MODELS.text,
    max_tokens: 4000,
    // Haiku 5.5 tänker som standard; för ren extraktion vill vi hela budgeten till JSON.
    // `disabled` godtas på Haiku 5.5 vid effort high eller lägre (standard är medium).
    thinking: { type: 'disabled' },
    system: BATCH_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  })
  const parsed = JSON.parse(stripFences(responseText(response)))
  const arr = Array.isArray(parsed) ? parsed : [parsed]
  return arr.map(normalizeEntry)
}

/** Textextraktion — Haiku (snabb/billig). */
export async function extractFromText(text: string): Promise<ExtractedEntry> {
  const response = await getAnthropic().messages.create({
    model: AI_MODELS.text,
    max_tokens: AI_MAX_TOKENS,
    thinking: { type: 'disabled' }, // se extractBatchFromText
    system: AI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  })
  return parseResponse(responseText(response))
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
    // Sonnet 5.5 avvisar `thinking: disabled` med 400 (det gjorde Sonnet 5 inte) — fotoimporten
    // föll på det efter modellbytet. Tänkandet går inte att stänga av här, så låt det vara på
    // men på låg nivå, och ge plats för både tänkande och JSON (tänkandet räknas mot max_tokens).
    // `output_config.effort` saknas i SDK-versionens typer men skickas med som det är.
    max_tokens: 4000,
    ...({ output_config: { effort: 'low' } } as object),
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
  return parseResponse(responseText(response))
}
