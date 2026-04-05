import { prisma } from './db'

interface SearchResult {
  id: string
  type: string
  title: string
  category: string
  ingredients: string[]
  instructions: string | null
  content: string | null
  source: string | null
  url: string | null
  notes: string | null
  imageUrls: string[]
  timesCooked: number
  lastCooked: Date | null
  createdAt: Date
  updatedAt: Date
  rank: number
}

/** Full-text search using PostgreSQL Swedish configuration with ranking */
export async function searchEntries(
  query: string,
  type?: string,
  category?: string
): Promise<SearchResult[]> {
  const typeFilter = type ? `AND "type" = '${type}'` : ''
  const categoryFilter = category ? `AND "category" = '${category}'` : ''

  const results = await prisma.$queryRawUnsafe<SearchResult[]>(
    `SELECT *, ts_rank(search_vector, plainto_tsquery('swedish', $1)) as rank
     FROM "Entry"
     WHERE search_vector @@ plainto_tsquery('swedish', $1)
     ${typeFilter}
     ${categoryFilter}
     ORDER BY rank DESC
     LIMIT 50`,
    query
  )

  return results
}
