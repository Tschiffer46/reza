/**
 * Affiliate-/handla-länkar för publika recept (Adtraction).
 *
 * SWAP-READY: vid lansering (innan Adtraction godkänt kanalen) pekar knappen mot en
 * riktig svensk mathandlare UTAN spårning, så att inga länkar är trasiga. När kanalen
 * är godkänd: sätt miljövariabeln `ADTRACTION_SHOP_URL` till handlarens spårade länk-
 * mall med platshållaren `{q}` för söktermen, t.ex.
 *
 *   ADTRACTION_SHOP_URL="https://track.adtraction.com/t/t?a=123&url=https%3A%2F%2Fwww.mathem.se%2Fsearch%3Fq%3D{q}"
 *
 * Ingen kodändring krävs då — bara env. Verifiera spårningen med ett testklick.
 */

/** Default-handlare (ospårad) tills Adtraction-mallen är satt. */
const FALLBACK_SHOP = 'https://www.mathem.se/search?q={q}'

export interface ShopLink {
  href: string
  /** true när en spårad Adtraction-mall används (env satt). */
  tracked: boolean
}

/**
 * Bygger handla-länken för ett recept. Söktermen är receptets titel så att
 * användaren landar på handlarens sökresultat för rätten/ingredienserna.
 */
export function buildShopLink(query: string): ShopLink {
  const template = process.env.ADTRACTION_SHOP_URL?.trim()
  const q = encodeURIComponent(query)
  if (template && template.includes('{q}')) {
    return { href: template.replace('{q}', q), tracked: true }
  }
  return { href: FALLBACK_SHOP.replace('{q}', q), tracked: false }
}
