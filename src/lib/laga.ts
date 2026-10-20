import { normalizeProtein } from '@/lib/protein'
import type { EntryDTO } from '@/lib/types'
import { entryFamilies, normalizeVisibility } from '@/lib/entry-access'

type UserRef = { name: string | null; email: string | null }
type UserWithId = UserRef & { id: string }

/** Visningsnamn för en användare (namn, annars del före @ i e-post). */
export function displayName(u: UserRef | null | undefined): string {
  if (!u) return 'Någon'
  if (u.name) return u.name
  if (u.email) return u.email.split('@')[0]
  return 'Någon'
}

/** Aggregera "lagad av" per användare ur ChangeLog-poster (action = cooked). */
/**
 * "Lagad av": en rad per person, flest gånger först. Grupperas på användar-id (två personer med
 * samma namn blev förut en), och id:t följer med så att appen kan ge personen hens familjefärg.
 */
export function aggregateCooked(
  changes: { action: string; user: UserWithId }[],
): { id: string; name: string; n: number }[] {
  const map = new Map<string, { id: string; name: string; n: number }>()
  for (const c of changes) {
    if (c.action !== 'cooked') continue
    const row = map.get(c.user.id) ?? { id: c.user.id, name: displayName(c.user), n: 0 }
    row.n += 1
    map.set(c.user.id, row)
  }
  return [...map.values()].sort((a, b) => b.n - a.n)
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
  protein?: string | null
  timesCooked: number
  ratingAvg: number | null
  ratingCount: number
  lastCooked: Date | null
  createdAt: Date
  visibility?: string | null
  family?: { id: string; name: string } | null
  shares?: { family: { id: string; name: string } }[]
  changes?: { action: string; user: UserWithId }[]
  _count?: { comments: number; reactions: number }
}

/** Inkludering som ger all meta för flödeskorten. */
export const ENTRY_META_INCLUDE = {
  family: { select: { id: true, name: true } },
  // Delningar behövs både för DTO:n ("syns i X och Y") och för åtkomstkontrollen.
  shares: { select: { family: { select: { id: true, name: true } } } },
  changes: { where: { action: 'cooked' }, select: { action: true, user: { select: { id: true, name: true, email: true } } } },
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
    protein: normalizeProtein(e.protein),
    timesCooked: e.timesCooked,
    ratingAvg: e.ratingAvg,
    ratingCount: e.ratingCount,
    lastCooked: e.lastCooked ? e.lastCooked.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    visibility: normalizeVisibility(e.visibility),
    family: e.family ? { id: e.family.id, name: e.family.name } : undefined,
    // Alla gemenskaper receptet syns i (tom lista = privat) — klienten slipper räkna ut det.
    families: entryFamilies(e),
    cookedBy: aggregateCooked(e.changes || []),
    heartCount: e._count?.reactions ?? 0,
    commentCount: e._count?.comments ?? 0,
  }
}
