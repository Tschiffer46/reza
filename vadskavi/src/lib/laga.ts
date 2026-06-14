import type { EntryDTO } from '@/lib/types'

type UserRef = { name: string | null; email: string | null }

/** Visningsnamn för en användare (namn, annars del före @ i e-post). */
export function displayName(u: UserRef | null | undefined): string {
  if (!u) return 'Någon'
  if (u.name) return u.name
  if (u.email) return u.email.split('@')[0]
  return 'Någon'
}

/** Aggregera "lagad av" per användare ur ChangeLog-poster (action = cooked). */
export function aggregateCooked(changes: { action: string; user: UserRef }[]): { name: string; n: number }[] {
  const map = new Map<string, number>()
  for (const c of changes) {
    if (c.action !== 'cooked') continue
    const name = displayName(c.user)
    map.set(name, (map.get(name) || 0) + 1)
  }
  return [...map.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n)
}

/** Form av Entry som searchEntries/queries returnerar (med includes). */
export type EntryWithMeta = {
  id: string
  type: string
  title: string
  category: string
  blurb: string | null
  time: string | null
  servings: number | null
  ingredients: string[]
  instructions: string | null
  content: string | null
  drinks: string | null
  source: string | null
  url: string | null
  imageUrls: string[]
  timesCooked: number
  ratingAvg: number | null
  ratingCount: number
  lastCooked: Date | null
  createdAt: Date
  family?: { id: string; name: string } | null
  changes?: { action: string; user: UserRef }[]
  _count?: { comments: number; reactions: number }
}

/** Inkludering som ger all meta för flödeskorten. */
export const ENTRY_META_INCLUDE = {
  family: { select: { id: true, name: true } },
  changes: { where: { action: 'cooked' }, select: { action: true, user: { select: { name: true, email: true } } } },
  _count: { select: { comments: true, reactions: true } },
} as const

export function toEntryDTO(e: EntryWithMeta): EntryDTO {
  return {
    id: e.id,
    type: e.type,
    title: e.title,
    category: e.category,
    blurb: e.blurb,
    time: e.time,
    servings: e.servings,
    ingredients: e.ingredients,
    instructions: e.instructions,
    content: e.content,
    drinks: e.drinks,
    source: e.source,
    url: e.url,
    imageUrls: e.imageUrls,
    timesCooked: e.timesCooked,
    ratingAvg: e.ratingAvg,
    ratingCount: e.ratingCount,
    lastCooked: e.lastCooked ? e.lastCooked.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    family: e.family ? { id: e.family.id, name: e.family.name } : undefined,
    cookedBy: aggregateCooked(e.changes || []),
    heartCount: e._count?.reactions ?? 0,
    commentCount: e._count?.comments ?? 0,
  }
}
