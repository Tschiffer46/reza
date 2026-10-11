/**
 * Huvudprotein per recept ("protein"), så att man kan filtrera på nöt/kyckling/fisk/vegetariskt.
 *
 * Nycklarna är KONTRAKT mot native-appen (laga-app) och lagras som de är i Entry.protein —
 * byt aldrig namn på dem, lägg bara till. `null` i databasen betyder okänt/ej satt, inte
 * "other": filtret ska inte låtsas veta något om recept som aldrig klassats.
 */
export const PROTEINS = [
  { key: 'beef', label: 'Nötkött' },
  { key: 'pork', label: 'Fläsk' },
  { key: 'chicken', label: 'Kyckling' },
  { key: 'fish', label: 'Fisk & skaldjur' },
  { key: 'vegetarian', label: 'Vegetariskt' },
  { key: 'vegan', label: 'Veganskt' },
  { key: 'other', label: 'Övrigt' },
] as const

export type Protein = (typeof PROTEINS)[number]['key']

const KEYS: readonly string[] = PROTEINS.map((p) => p.key)

export function isProtein(x: unknown): x is Protein {
  return typeof x === 'string' && KEYS.includes(x)
}

/**
 * Gör om vad som helst (klientens body, modellens JSON) till en giltig nyckel eller null.
 * Tolerant mot versaler/blanksteg, eftersom en modell gärna svarar "Chicken " — men
 * gissar aldrig: okänt värde blir null, inte "other".
 */
export function normalizeProtein(x: unknown): Protein | null {
  if (typeof x !== 'string') return null
  const k = x.trim().toLowerCase()
  return isProtein(k) ? k : null
}

/** Lista för AI-prompten: nyckel med svensk betydelse. */
export const PROTEIN_PROMPT_LIST = PROTEINS.map((p) => `"${p.key}" (${p.label})`).join(', ')
