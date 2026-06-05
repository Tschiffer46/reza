import type { Prisma } from '@prisma/client'
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
 * Lista/sök recept tvärs över användarens familjer. Sökning sker med Prisma
 * (skiftlägesokänslig delsträngsmatchning); kan begränsas till en familj.
 */
export async function searchEntries({ familyIds, q, type, category, family, sort }: EntryQuery) {
  const scopeIds = family && familyIds.includes(family) ? [family] : familyIds

  const where: Prisma.EntryWhereInput = { familyId: { in: scopeIds } }
  if (type) where.type = type
  if (category) where.category = category

  const term = q?.trim()
  if (term) {
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { instructions: { contains: term, mode: 'insensitive' } },
      { content: { contains: term, mode: 'insensitive' } },
      { source: { contains: term, mode: 'insensitive' } },
      { ingredients: { has: term } },
    ]
  }

  const orderBy: Prisma.EntryOrderByWithRelationInput =
    sort === 'timesCooked'
      ? { timesCooked: 'desc' }
      : sort === 'popular'
        ? { reactions: { _count: 'desc' } }
        : sort === 'lastCooked'
          ? { lastCooked: 'desc' }
          : sort === 'title'
            ? { title: 'asc' }
            : { createdAt: 'desc' }

  return prisma.entry.findMany({ where, orderBy, take: 100, include: ENTRY_META_INCLUDE })
}
