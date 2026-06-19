/** Medlemssnack: inlägg lever i max så här länge innan de göms/rensas. */
export const SNACK_TTL_DAYS = 7

/** Tidsgräns: inlägg äldre än detta visas inte och rensas opportunistiskt. */
export function snackCutoff(): Date {
  return new Date(Date.now() - SNACK_TTL_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Plocka ut @-omnämnanden ur text och matcha mot medlemmars visningsnamn.
 * Matchar @token mot förnamnet (första ordet) i namnet, t.ex. "@Kalle" →
 * medlemmen "Kalle Svensson". Returnerar unika userId:n.
 */
export function parseMentions(text: string, members: { id: string; name: string }[]): string[] {
  const tokens = text.match(/@([\p{L}][\p{L}\d_-]*)/gu)
  if (!tokens) return []
  const wanted = new Set(tokens.map((t) => t.slice(1).toLowerCase()))
  const ids = new Set<string>()
  for (const m of members) {
    const first = m.name.trim().split(/\s+/)[0]?.toLowerCase()
    if (first && wanted.has(first)) ids.add(m.id)
  }
  return [...ids]
}

/** Kort svensk "för X sedan"-text. */
export function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'nyss'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min sedan`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} tim sedan`
  const days = Math.floor(h / 24)
  return days === 1 ? 'igår' : `${days} dagar sedan`
}
