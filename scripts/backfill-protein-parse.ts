/**
 * Rena hjälpare för scripts/backfill-protein.ts (ingen DB, inget nät — testas i
 * scripts/test-protein.ts).
 *
 * Medvetet självbärande: runtime-imagen innehåller scripts/ och node_modules men INTE src/,
 * så härifrån går det inte att importera src/lib/protein.ts. Nyckellistan är därför
 * duplicerad, och testet jämför den mot src/lib/protein.ts så att de inte glider isär.
 */
export const BACKFILL_KEYS = ['beef', 'pork', 'chicken', 'fish', 'vegetarian', 'vegan', 'other'] as const

// Hålls i takt med AI_MODELS.text i src/lib/ai.ts (scripts/test-protein.ts jämför).
export const BACKFILL_MODEL = 'claude-haiku-5-5'

export type BackfillKey = (typeof BACKFILL_KEYS)[number]

export const BACKFILL_SYSTEM_PROMPT = `Du klassar recept efter huvudprotein.
Du får en JSON-lista med recept (id, title, ingredients). Svara med ETT JSON-objekt {"<id>": "<nyckel>"} och inget annat.
Nycklar: "beef" (nötkött), "pork" (fläsk), "chicken" (kyckling), "fish" (fisk & skaldjur), "vegetarian" (inget kött/fisk, mejeri och ägg ok), "vegan" (inga animaliska produkter), "other" (annat, t.ex. lamm och vilt).
Regel: det proteinet som dominerar huvudrätten. Är du osäker, utelämna receptet helt — gissa aldrig.`

/** Första textblocket — aldrig content[0], som på Haiku 5.5 är ett thinking-block. */
export function firstText(content: ReadonlyArray<{ type: string; text?: string }>): string | null {
  const block = content.find((b) => b.type === 'text' && typeof b.text === 'string')
  return block?.text ?? null
}

/**
 * Tolka modellens svar till {id → nyckel}. Släpper tyst allt som inte är ett id vi frågade
 * om eller en giltig nyckel: en halvdålig batch ska ge de rader den kan, inte kasta bort
 * alla — och en felaktig nyckel i databasen är sämre än en tom.
 */
export function parseBackfillResponse(text: string, askedIds: readonly string[]): Map<string, BackfillKey> {
  const out = new Map<string, BackfillKey>()
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  // Tål en mening före/efter objektet: ta från första { till sista }.
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end <= start) return out
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return out
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return out
  const asked = new Set(askedIds)
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!asked.has(id) || typeof value !== 'string') continue
    const key = value.trim().toLowerCase()
    if ((BACKFILL_KEYS as readonly string[]).includes(key)) out.set(id, key as BackfillKey)
  }
  return out
}
