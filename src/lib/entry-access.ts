// ── Synlighet för recept: privat vs en eller flera gemenskaper ──────────────
//
// Ett recept har alltid en **primärgemenskap** (`Entry.familyId`) — den gemenskap det
// skapades i. Utöver den kan det delas till fler via `EntryShare`. Sätts `visibility`
// till "private" syns det bara för skaparen, oavsett vad familyId pekar på.
//
// Varför primärgemenskapen finns kvar i stället för en ren many-to-many: befintliga rader
// har redan `familyId` och inga shares, så de fortsätter bete sig exakt som förut. Vi kör
// `prisma db push` utan migrations (se CLAUDE.md) ⇒ en modell som inte kräver
// datamigrering är inte en bekvämlighet, det är ett krav.
//
// ALL åtkomstkontroll för recept ska gå genom det här modulen. Ligger regeln på ett ställe
// kan den inte glida isär mellan flödet, detaljvyn, kommentarerna och sökningen.

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { assertMember, userFamilyIds } from '@/lib/family'

export type Visibility = 'family' | 'private'

export const VISIBILITY_FAMILY: Visibility = 'family'
export const VISIBILITY_PRIVATE: Visibility = 'private'

/**
 * Pseudovärde för `?family=`-filtret som betyder "bara mina privata recept".
 * Ett gemenskaps-id är ett cuid och kan aldrig kollidera med det här värdet.
 */
export const PRIVATE_SCOPE = 'private'

/** Allt som inte uttryckligen är "private" behandlas som gemenskapssynligt. */
export function normalizeVisibility(value: unknown): Visibility {
  return value === VISIBILITY_PRIVATE ? VISIBILITY_PRIVATE : VISIBILITY_FAMILY
}

/** Minsta form av ett recept som räcker för att avgöra åtkomst. */
export type EntryAccessShape = {
  visibility?: string | null
  familyId: string
  creatorId: string
  shares?: { familyId: string }[]
}

/** Prisma-villkor: alla recept användaren får se (egna privata + gemenskapernas). */
export function visibleEntryWhere(userId: string, familyIds: string[]): Prisma.EntryWhereInput {
  return {
    OR: [
      { visibility: VISIBILITY_PRIVATE, creatorId: userId },
      {
        visibility: { not: VISIBILITY_PRIVATE },
        OR: [
          { familyId: { in: familyIds } },
          { shares: { some: { familyId: { in: familyIds } } } },
        ],
      },
    ],
  }
}

/** Prisma-villkor: recept som syns i EN given gemenskap (primär eller delad dit). */
export function familyEntryWhere(familyId: string): Prisma.EntryWhereInput {
  return {
    visibility: { not: VISIBILITY_PRIVATE },
    OR: [{ familyId }, { shares: { some: { familyId } } }],
  }
}

/** Prisma-villkor: användarens egna privata recept. */
export function privateEntryWhere(userId: string): Prisma.EntryWhereInput {
  return { visibility: VISIBILITY_PRIVATE, creatorId: userId }
}

/**
 * Villkoret för ett flöde, givet ett valfritt `?family=`-filter.
 * `PRIVATE_SCOPE` ⇒ bara privata, ett gemenskaps-id man tillhör ⇒ bara den, annars allt.
 */
export function feedEntryWhere(
  userId: string,
  familyIds: string[],
  family?: string | null,
): Prisma.EntryWhereInput {
  if (family === PRIVATE_SCOPE) return privateEntryWhere(userId)
  if (family && familyIds.includes(family)) return familyEntryWhere(family)
  return visibleEntryWhere(userId, familyIds)
}

/** Samma regel som `feedEntryWhere`, men som SQL-fragment för fulltextsökningen. */
export function feedEntrySql(
  userId: string,
  familyIds: string[],
  family?: string | null,
): Prisma.Sql {
  if (family === PRIVATE_SCOPE) {
    return Prisma.sql`("Entry".visibility = ${VISIBILITY_PRIVATE} AND "Entry"."creatorId" = ${userId})`
  }
  const scopeIds = family && familyIds.includes(family) ? [family] : familyIds
  const inFamilies = scopeIds.length
    ? Prisma.sql`("Entry".visibility <> ${VISIBILITY_PRIVATE} AND (
        "Entry"."familyId" IN (${Prisma.join(scopeIds)})
        OR EXISTS (
          SELECT 1 FROM "EntryShare" s
          WHERE s."entryId" = "Entry".id AND s."familyId" IN (${Prisma.join(scopeIds)})
        )
      ))`
    : Prisma.sql`FALSE`
  // Ett uttryckligt gemenskapsfilter ska inte blanda in de privata recepten.
  if (family && familyIds.includes(family)) return inFamilies
  return Prisma.sql`(${inFamilies} OR ("Entry".visibility = ${VISIBILITY_PRIVATE} AND "Entry"."creatorId" = ${userId}))`
}

/** Åtkomstkontroll för ett redan hämtat recept (kräver att `shares` är inkluderat). */
export function canSeeEntry(
  entry: EntryAccessShape | null | undefined,
  userId: string,
  familyIds: string[],
): boolean {
  if (!entry) return false
  if (normalizeVisibility(entry.visibility) === VISIBILITY_PRIVATE) {
    return entry.creatorId === userId
  }
  if (familyIds.includes(entry.familyId)) return true
  return (entry.shares ?? []).some((s) => familyIds.includes(s.familyId))
}

/**
 * Får användaren ändra/radera receptet?
 *
 * Privata recept är skaparens ensak. Gemenskapsrecept följer samma regel som förut:
 * alla medlemmar i en gemenskap receptet syns i får redigera det.
 */
export function canEditEntry(
  entry: EntryAccessShape | null | undefined,
  userId: string,
  familyIds: string[],
): boolean {
  if (!entry) return false
  if (normalizeVisibility(entry.visibility) === VISIBILITY_PRIVATE) {
    return entry.creatorId === userId
  }
  return canSeeEntry(entry, userId, familyIds)
}

/** Inkludering som behövs för att kunna svara på åtkomstfrågor + bygga DTO:n. */
export const ENTRY_SHARES_INCLUDE = {
  shares: { select: { family: { select: { id: true, name: true } } } },
} as const

/**
 * Alla gemenskaper receptet syns i (primär först). Tom lista = privat.
 * Används av DTO:n så att klienten kan visa "Familjen + Kollegorna" på ett kort.
 */
export function entryFamilies(entry: {
  visibility?: string | null
  family?: { id: string; name: string } | null
  shares?: { family: { id: string; name: string } }[]
}): { id: string; name: string }[] {
  if (normalizeVisibility(entry.visibility) === VISIBILITY_PRIVATE) return []
  const out: { id: string; name: string }[] = []
  const seen = new Set<string>()
  for (const f of [entry.family, ...(entry.shares ?? []).map((s) => s.family)]) {
    if (!f || seen.has(f.id)) continue
    seen.add(f.id)
    out.push({ id: f.id, name: f.name })
  }
  return out
}

/** Var ett recept ska hamna, uträknat ur request-bodyn. */
export type EntryTargets = {
  visibility: Visibility
  /** Primärgemenskap — alltid satt, även för privata recept (ursprunget). */
  familyId: string
  /** Ytterligare gemenskaper (utan primären). Tom för privata recept. */
  shareFamilyIds: string[]
}

/**
 * Tolka `{ visibility, familyIds[], familyId }` ur en request och validera medlemskap.
 *
 * Accepterar tre former, i fallande prioritet:
 *  1. `visibility: "private"` ⇒ privat; `familyId`/`familyIds` används bara som ursprung.
 *  2. `familyIds: [...]` ⇒ delas till alla dessa; den första blir primär.
 *  3. `familyId: "…"` ⇒ enskild gemenskap (formen webben och app-bygge 27 använder).
 *
 * Kastar `FORBIDDEN` om användaren inte är medlem i någon av de angivna gemenskaperna.
 */
export async function resolveEntryTargets(
  userId: string,
  body: { visibility?: unknown; familyIds?: unknown; familyId?: unknown },
  fallbackFamilyId: string,
): Promise<EntryTargets> {
  const requested = Array.isArray(body.familyIds)
    ? (body.familyIds.filter((v): v is string => typeof v === 'string' && v.length > 0) as string[])
    : typeof body.familyId === 'string' && body.familyId
      ? [body.familyId]
      : []

  // Dubbletter bort, ordning bevarad (första = primär).
  const unique = [...new Set(requested)]
  for (const id of unique) {
    await assertMember(userId, id) // kastar FORBIDDEN
  }

  if (normalizeVisibility(body.visibility) === VISIBILITY_PRIVATE) {
    return {
      visibility: VISIBILITY_PRIVATE,
      familyId: unique[0] ?? fallbackFamilyId,
      shareFamilyIds: [],
    }
  }

  const [primary, ...rest] = unique.length ? unique : [fallbackFamilyId]
  return { visibility: VISIBILITY_FAMILY, familyId: primary, shareFamilyIds: rest }
}

/**
 * Skriv om ett recepts delningar så att de exakt matchar `targets`.
 * Privata recept får inga delningar alls — så att en växling gemensam → privat städar
 * bort de gamla raderna i stället för att lämna kvar dem som en dold bakdörr.
 */
export async function syncEntryShares(
  tx: Prisma.TransactionClient,
  entryId: string,
  targets: EntryTargets,
): Promise<void> {
  const ids = [...new Set(targets.shareFamilyIds)].filter((id) => id !== targets.familyId)
  await tx.entryShare.deleteMany({ where: { entryId, ...(ids.length ? { familyId: { notIn: ids } } : {}) } })
  if (ids.length) {
    await tx.entryShare.createMany({
      data: ids.map((familyId) => ({ entryId, familyId })),
      skipDuplicates: true,
    })
  }
}

/**
 * Hämta ett recept **om** användaren får se det, annars null.
 *
 * Underrouterna (kommentarer, anteckningar, betyg, hjärtan) hade var sin kopia av
 * "är jag medlem i receptets gemenskap?". Med privata och delade recept finns det inte
 * längre ett enda familyId att jämföra mot, så regeln bor här — en kopia som glöms bort
 * blir annars en läcka.
 */
export async function findVisibleEntry(entryId: string, userId: string) {
  const [entry, familyIds] = await Promise.all([
    prisma.entry.findUnique({
      where: { id: entryId },
      include: { shares: { select: { familyId: true } } },
    }),
    userFamilyIds(userId),
  ])
  return canSeeEntry(entry, userId, familyIds) ? entry : null
}
