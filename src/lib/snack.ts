/** Medlemssnack: inlägg lever i max så här länge innan de göms/rensas. */
export const SNACK_TTL_DAYS = 7

/** Tidsgräns: inlägg äldre än detta visas inte och rensas opportunistiskt. */
export function snackCutoff(): Date {
  return new Date(Date.now() - SNACK_TTL_DAYS * 24 * 60 * 60 * 1000)
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
