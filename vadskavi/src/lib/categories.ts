/**
 * Standardkategorier som nya gemenskaper får vid skapande (kopieras in i Category-
 * tabellen kopplat till respektive gemenskap). Återanvänds av seed och av
 * gemenskapeskapande-flödet i senare sprintar.
 */
export const DEFAULT_CATEGORIES: { name: string; type: 'recipe' | 'tip' }[] = [
  // Recept
  { name: 'Huvudrätt', type: 'recipe' },
  { name: 'Förrätt', type: 'recipe' },
  { name: 'Efterrätt', type: 'recipe' },
  { name: 'Bakning', type: 'recipe' },
  { name: 'Sallad', type: 'recipe' },
  { name: 'Soppa', type: 'recipe' },
  { name: 'Frukost', type: 'recipe' },
  { name: 'Snacks', type: 'recipe' },
  { name: 'Dryck', type: 'recipe' },
  // Tips
  { name: 'Matlagning', type: 'tip' },
  { name: 'Förvaring', type: 'tip' },
  { name: 'Kryddor', type: 'tip' },
  { name: 'Redskap', type: 'tip' },
  { name: 'Övrigt', type: 'tip' },
]
