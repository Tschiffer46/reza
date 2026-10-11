import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ENTRY_META_INCLUDE } from '@/lib/laga'
import { MIN_COMPACT_LENGTH, containsPattern, toPrefixTsQuery, tokenizeQuery } from '@/lib/search-terms'
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
  sort?: string | null
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
    // Ingen pg_trgm: den kräver CREATE EXTENSION, och datamängden är liten nog för seq scan.
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
    const ids = rows.map((r) => r.id)
    if (ids.length === 0) return []
    const found = await prisma.entry.findMany({ where: { id: { in: ids } }, include: ENTRY_META_INCLUDE })
    const order = new Map(ids.map((id, i) => [id, i] as const))
    return found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  }

  const where: Prisma.EntryWhereInput = { ...feedEntryWhere(userId, familyIds, family) }
  if (type) where.type = type
  if (category) where.category = category

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
