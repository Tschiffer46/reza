/**
 * Rena hjälpfunktioner för receptsökningen (ingen DB, ingen import av prisma) så att de går
 * att testa med `npm run test:search`.
 *
 * Allt som hamnar i SQL/tsquery går först genom `tokenizeQuery`: bara bokstäver och siffror
 * släpps igenom. Det är den enda spärren mellan användarens text och `to_tsquery`, vars
 * syntax (`&`, `|`, `!`, `:`, `(`, `'`) annars ger syntaxfel eller ändrar frågans mening.
 */

/** Tak på antal sökord — en klistrad mening ska inte bli en jättelång OR/AND-kedja. */
export const MAX_SEARCH_TOKENS = 8

/** Kortaste sammanskrivna fråga som får matcha som delsträng; kortare ger bara brus. */
export const MIN_COMPACT_LENGTH = 3

export interface SearchTerms {
  /** Sanerade sökord (gemener, bara bokstäver/siffror). Tom lista = ingen sökning. */
  tokens: string[]
  /** Orden ihopskrivna utan mellanrum — fångar "kyckling gryta" mot "kycklinggryta". */
  compact: string
}

export function tokenizeQuery(q: string | null | undefined): SearchTerms {
  const tokens = (q ?? '')
    .toLowerCase()
    // \p{L} = alla bokstäver (åäöéü …), \p{N} = siffror. Allt annat är avgränsare.
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, MAX_SEARCH_TOKENS)
  return { tokens, compact: tokens.join('') }
}

/**
 * Prefix-tsquery av sanerade ord: `['kyckl','gryt']` → `kyckl:* & gryt:*`.
 * Tar bara emot ord från `tokenizeQuery`; skickas som bunden parameter till `to_tsquery`.
 */
export function toPrefixTsQuery(tokens: string[]): string {
  return tokens.map((t) => `${t}:*`).join(' & ')
}

/**
 * Escapar LIKE-jokrar. Efter `tokenizeQuery` kan de inte förekomma, men funktionen står
 * kvar som andra försvarslinje om någon senare släpper in fler tecken i tokens.
 */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** `%ord%`-mönster för ILIKE (med standard-escapetecknet `\`). */
export function containsPattern(s: string): string {
  return `%${escapeLike(s)}%`
}

/** Kortaste sökord som får stavningstoleransen (trigram). Kortare ord ger bara slumpträffar. */
export const MIN_FUZZY_LENGTH = 4

/** Så många träffar från ordinarie sökning räcker; färre ⇒ prova stavningstolerans. */
export const FUZZY_TRIGGER_HITS = 3

/**
 * Lägsta word_similarity (0–1) för att ett sökord ska räknas som "stavat fel men menar det".
 * Uppmätt mot riktig pg_trgm (PG16): pankakor→pannkakor 0.8, lasange→lasagne 0.5, kycling→kycklinggryta 0.45
 * (sammansättningar straffas), kottbular→köttbullar 0.42. Orelaterade ord (blomkål, pizza, tomatsoppa …)
 * hamnade ≤ 0.35 mot testdatan. 0.4 släpper in fallen ovan; höj om riktig data ger brus.
 */
export const FUZZY_THRESHOLD = 0.4

/** Ord som får användas i stavningstoleransen. Alla måste vara tillräckligt långa, annars ingen fuzzy alls. */
export function fuzzyTokens(tokens: string[]): string[] {
  if (tokens.length === 0 || tokens.some((t) => [...t].length < MIN_FUZZY_LENGTH)) return []
  return tokens
}

/** Ordinarie träffar först (deras ordning orörd), därefter fuzzy-träffar utan dubbletter. */
export function mergeIds(primary: string[], fuzzy: string[]): string[] {
  const seen = new Set(primary)
  return [...primary, ...fuzzy.filter((id) => !seen.has(id))]
}
