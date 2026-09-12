import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ENTRY_META_INCLUDE } from '@/lib/laga'
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
 * används svensk fulltext (tsvector + ts_rank); annars Prisma-listning med vald sortering.
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
  const term = q?.trim()

  if (term) {
    // Rank-ordnade id:n via tsvector
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Entry"
      WHERE ${feedEntrySql(userId, familyIds, family)}
        AND "searchVector" @@ plainto_tsquery('swedish', ${term})
        ${type ? Prisma.sql`AND type = ${type}` : Prisma.empty}
        ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
      ORDER BY ts_rank("searchVector", plainto_tsquery('swedish', ${term})) DESC
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
