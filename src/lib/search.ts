import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ENTRY_META_INCLUDE } from '@/lib/laga'
import {
  FUZZY_THRESHOLD,
  FUZZY_TRIGGER_HITS,
  MIN_COMPACT_LENGTH,
  containsPattern,
  fuzzyTokens,
  mergeIds,
  toPrefixTsQuery,
  tokenizeQuery,
} from '@/lib/search-terms'
import { feedEntrySql, feedEntryWhere } from '@/lib/entry-access'

export interface EntryQuery {
  /** Den som söker — behövs för att få med hens egna privata recept. */
  userId: string
  /** Gemenskaper användaren tillhör (sökningen spänner över dessa). */
  familyIds: string[]
  q?: string | null
  /**
   * Valfritt: begränsa till en specifik gemenskap, eller `PRIVATE_SCOPE`
   * ("private") för att bara visa användarens privata recept.
   */
  family?: string | null
  type?: string | null
  category?: string | null
  /** Huvudprotein-nyckel; ogiltigt värde ger tom lista snarare än ett ofiltrerat flöde. */
  protein?: string | null
  sort?: string | null
}

let fuzzyWarned = false

/**
 * Stavningstolerant reservväg: "pankakor" → "pannkakor". Körs bara när ordinarie sökning gav
 * få träffar. Varje sökord måste likna något ord i rubriken eller ingredienserna
 * (`word_similarity` ≥ FUZZY_THRESHOLD); rangordnas på snittlikhet, rubrik väger tyngst.
 *
 * Får ALDRIG fälla sökningen: saknas pg_trgm (CREATE EXTENSION nekades vid deploy) kastar
 * Postgres "function word_similarity does not exist" — då loggar vi en gång och returnerar
 * tomt, så sökningen beter sig exakt som innan. Åtkomst går som vanligt genom feedEntrySql.
 */
async function fuzzyIds(p: {
  userId: string
  familyIds: string[]
  family?: string | null
  type?: string | null
  category?: string | null
  protein?: string | null
  tokens: string[]
}): Promise<string[]> {
  if (p.tokens.length === 0) return []
  const title = Prisma.sql`lower("Entry".title)`
  const ingr = Prisma.sql`lower(array_to_string("Entry".ingredients, ' '))`
  // Per ord: bästa av rubrik (full vikt) och ingredienser (0,8× — en ingrediens är svagare signal).
  const score = (t: string) =>
    Prisma.sql`GREATEST(word_similarity(${t}, ${title}), 0.8 * word_similarity(${t}, ${ingr}))`
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Entry"
      WHERE ${feedEntrySql(p.userId, p.familyIds, p.family)}
        AND ${Prisma.join(p.tokens.map((t) => Prisma.sql`${score(t)} >= ${FUZZY_THRESHOLD}`), ' AND ')}
        ${p.type ? Prisma.sql`AND type = ${p.type}` : Prisma.empty}
        ${p.category ? Prisma.sql`AND category = ${p.category}` : Prisma.empty}
        ${p.protein ? Prisma.sql`AND protein = ${p.protein}` : Prisma.empty}
      ORDER BY (${Prisma.join(p.tokens.map(score), ' + ')}) DESC, "createdAt" DESC
      LIMIT 50
    `
    return rows.map((r) => r.id)
  } catch (e) {
    if (!fuzzyWarned) {
      fuzzyWarned = true
      console.warn('Stavningstolerant sökning avstängd (pg_trgm saknas?):', e instanceof Error ? e.message : e)
    }
    return []
  }
}

/**
 * Lista/sök recept tvärs över användarens gemenskaper + hens privata recept. Med sökterm
 * används svensk fulltext med prefix (tsvector + ts_rank) plus delsträng/sammanskrivning; annars Prisma-listning med vald sortering.
 *
 * Synlighetsregeln ligger i src/lib/entry-access.ts och används här i BÅDA grenarna
 * (`feedEntrySql` för rå-SQL, `feedEntryWhere` för Prisma) så att sökningen aldrig kan
 * visa något som listningen döljer.
 */
export async function searchEntries({
  userId,
  familyIds,
  q,
  type,
  category,
  protein,
  family,
  sort,
}: EntryQuery) {
  const { tokens, compact } = tokenizeQuery(q)

  // Tom efter sanering (t.ex. bara "&!") ⇒ behandla som ingen sökning alls, i stället för
  // att skicka en tom tsquery som matchar ingenting.
  if (tokens.length > 0) {
    const tsQuery = toPrefixTsQuery(tokens)
    // Rubrik + innehåll i klartext, för delsträngsträffar som tsvector inte ger (se nedan).
    const hay = Prisma.sql`lower("Entry".title || ' ' || coalesce("Entry".blurb, '') || ' ' || array_to_string("Entry".ingredients, ' ') || ' ' || coalesce("Entry".category, ''))`
    const hayCompact = Prisma.sql`regexp_replace(${hay}, '[[:space:]]', '', 'g')`
    const titleCompact = Prisma.sql`regexp_replace(lower("Entry".title), '[[:space:]]', '', 'g')`
    const useCompact = compact.length >= MIN_COMPACT_LENGTH
    const compactPattern = containsPattern(compact)
    const allIn = (col: Prisma.Sql) =>
      Prisma.join(tokens.map((t) => Prisma.sql`${col} LIKE ${containsPattern(t)}`), ' AND ')

    // Tre vägar in, vilken som helst räcker:
    //  (a) prefix-tsquery: "kyckl" hittar kyckling (plainto_tsquery krävde hela ord).
    //  (b) varje sökord som delsträng: fångar sammansättningar tsvector inte delar upp,
    //      t.ex. "gryta" i "Kycklinggryta".
    //  (c) hopskrivet: "kyckling gryta" mot "Kycklinggryta" och, åt andra hållet,
    //      "kycklinggryta" mot "Kyckling gryta" (särskrivning).
    // Få träffar ⇒ stavningstolerans via pg_trgm längre ned (fuzzyIds). Själva huvudfrågan
    // använder inte pg_trgm och fungerar alltså även om tillägget saknas.
    // tsQuery byggs bara av sanerade ord och går som bunden parameter, aldrig interpolerad.
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Entry"
      WHERE ${feedEntrySql(userId, familyIds, family)}
        AND (
          "searchVector" @@ to_tsquery('swedish', ${tsQuery})
          OR (${allIn(hay)})
          ${useCompact ? Prisma.sql`OR ${hayCompact} LIKE ${compactPattern}` : Prisma.empty}
        )
        ${type ? Prisma.sql`AND type = ${type}` : Prisma.empty}
        ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
        ${protein ? Prisma.sql`AND protein = ${protein}` : Prisma.empty}
      ORDER BY
        -- Träff i titeln först
        (
          (${allIn(Prisma.sql`lower("Entry".title)`)})
          ${useCompact ? Prisma.sql`OR ${titleCompact} LIKE ${compactPattern}` : Prisma.empty}
        ) DESC,
        ts_rank("searchVector", to_tsquery('swedish', ${tsQuery})) DESC,
        "createdAt" DESC
      LIMIT 100
    `
    let ids = rows.map((r) => r.id)
    if (ids.length < FUZZY_TRIGGER_HITS) {
      const extra = await fuzzyIds({ userId, familyIds, family, type, category, protein, tokens: fuzzyTokens(tokens) })
      ids = mergeIds(ids, extra)
    }
    if (ids.length === 0) return []
    const found = await prisma.entry.findMany({ where: { id: { in: ids } }, include: ENTRY_META_INCLUDE })
    const order = new Map(ids.map((id, i) => [id, i] as const))
    return found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  }

  const where: Prisma.EntryWhereInput = { ...feedEntryWhere(userId, familyIds, family) }
  if (type) where.type = type
  if (category) where.category = category
  if (protein) where.protein = protein

  const orderBy: Prisma.EntryOrderByWithRelationInput =
    sort === 'timesCooked'
      ? { timesCooked: 'desc' }
      : sort === 'rating'
        ? { ratingAvg: { sort: 'desc', nulls: 'last' } }
        : sort === 'popular'
          ? { reactions: { _count: 'desc' } }
          : sort === 'lastCooked'
          ? { lastCooked: 'desc' }
          : sort === 'title'
            ? { title: 'asc' }
            : { createdAt: 'desc' }

  return prisma.entry.findMany({ where, orderBy, take: 100, include: ENTRY_META_INCLUDE })
}
