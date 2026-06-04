import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export interface EntryQuery {
  familyId: string
  q?: string | null
  type?: string | null
  category?: string | null
  sort?: string | null
}

/**
 * Lista/sök familjens entries. Sökning sker med Prisma (skiftlägesokänslig
 * delsträngsmatchning) över titel/instruktioner/innehåll/källa, samt exakt
 * matchning mot ingrediens-arrayen. (Postgres tsvector kan bli en framtida
 * uppgradering — men ILIKE fungerar robust med `prisma db push`.)
 */
export async function searchEntries({ familyId, q, type, category, sort }: EntryQuery) {
  const where: Prisma.EntryWhereInput = { familyId }
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
      : sort === 'lastCooked'
        ? { lastCooked: 'desc' }
        : sort === 'title'
          ? { title: 'asc' }
          : { createdAt: 'desc' }

  return prisma.entry.findMany({ where, orderBy, take: 100 })
}
