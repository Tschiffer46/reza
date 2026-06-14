import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ENTRY_META_INCLUDE } from '@/lib/laga'

export interface EntryQuery {
  /** Familjer användaren tillhör (sökningen spänner över dessa). */
  familyIds: string[]
  q?: string | null
  type?: string | null
  category?: string | null
  /** Valfritt: begränsa till en specifik familj. */
  family?: string | null
  sort?: string | null
}

/**
 * Lista/sök recept tvärs över användarens familjer. Med sökterm används svensk
 * fulltext (tsvector + ts_rank); annars Prisma-listning med vald sortering.
 */
export async function searchEntries({ familyIds, q, type, category, family, sort }: EntryQuery) {
  const scopeIds = family && familyIds.includes(family) ? [family] : familyIds
  if (scopeIds.length === 0) return []

  const term = q?.trim()

  if (term) {
    // Rank-ordnade id:n via tsvector
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Entry"
      WHERE "familyId" IN (${Prisma.join(scopeIds)})
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

  const where: Prisma.EntryWhereInput = { familyId: { in: scopeIds } }
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
