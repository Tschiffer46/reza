/** Gemenskapens valbara bakgrunder: [sidbakgrund, tom-media-ton]. */
export const BACKGROUNDS: Record<string, [string, string]> = {
  Linne: ['#f6f5f1', '#eceae4'],
  Varm: ['#faf3e8', '#efe6d6'],
  Dimma: ['#eef0f2', '#e2e6e9'],
  Salvia: ['#eef2ec', '#dfe7df'],
  Sand: ['#f3ecdf', '#e7ddca'],
}

export const BACKGROUND_NAMES = Object.keys(BACKGROUNDS)

/** Sätt CSS-variabler för vald bakgrund (klientsida). */
export function applyBackground(name: string | null | undefined) {
  if (typeof document === 'undefined') return
  const preset = (name && BACKGROUNDS[name]) || BACKGROUNDS.Linne
  document.documentElement.style.setProperty('--bg', preset[0])
  document.documentElement.style.setProperty('--thumb-empty', preset[1])
}
