/**
 * Fristående tester för de rena sökhjälparna i src/lib/search-terms.ts.
 * Körs med `npm run test:search`. SQL:en i src/lib/search.ts testas INTE här (ingen DB) —
 * bara det som bygger parametrarna till den.
 */
import {
  MAX_SEARCH_TOKENS,
  containsPattern,
  escapeLike,
  toPrefixTsQuery,
  tokenizeQuery,
} from '../src/lib/search-terms'

let failed = 0

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) {
    failed++
    console.error(`✗ ${name}\n    förväntat: ${JSON.stringify(expected)}\n    fick:      ${JSON.stringify(actual)}`)
  } else {
    console.log(`✓ ${name}`)
  }
}

/* ------------------------------------------------------------- tokenisering */

check('gemener + split på mellanslag', tokenizeQuery('Kyckling  GRYTA').tokens, ['kyckling', 'gryta'])
check('svenska bokstäver behålls', tokenizeQuery('Räksmörgås Åäö').tokens, ['räksmörgås', 'åäö'])
check('é och ü behålls', tokenizeQuery('Crème brûlée Müsli').tokens, ['crème', 'brûlée', 'müsli'])
check('siffror behålls', tokenizeQuery('paj 2 pers').tokens, ['paj', '2', 'pers'])
check('specialtecken blir avgränsare', tokenizeQuery(`o'brien & co | !x :y (z`).tokens, ['o', 'brien', 'co', 'x', 'y', 'z'])
check('bara skiljetecken ger inga ord', tokenizeQuery(`'&|:!(  `).tokens, [])
check('tom/null/undefined', [tokenizeQuery('').tokens, tokenizeQuery(null).tokens, tokenizeQuery(undefined).tokens], [[], [], []])
check('tak på antal ord', tokenizeQuery('a b c d e f g h i j').tokens.length, MAX_SEARCH_TOKENS)
check('bindestreck delar ord', tokenizeQuery('kyckling-gryta').tokens, ['kyckling', 'gryta'])

/* ------------------------------------------------------------ sammanskrivet */

check('compact: utan mellanslag', tokenizeQuery('Kyckling gryta').compact, 'kycklinggryta')
check('compact: tom för tom fråga', tokenizeQuery('  ').compact, '')

/* ------------------------------------------------------------------ tsquery */

check('tsquery: prefix + AND', toPrefixTsQuery(['kyckl', 'gryt']), 'kyckl:* & gryt:*')
check('tsquery: ett ord', toPrefixTsQuery(['pasta']), 'pasta:*')
check('tsquery: tom lista', toPrefixTsQuery([]), '')
const evil = toPrefixTsQuery(tokenizeQuery(`x' | !(y) & z:* ; DROP`).tokens)
check('tsquery: inga operatorer från användaren', evil.replace(/:\*/g, '').replace(/ & /g, ' ').split(' ').every((w) => /^[\p{L}\p{N}]+$/u.test(w)), true)
check('tsquery: exakt form efter sanering', evil, 'x:* & y:* & z:* & drop:*')

/* --------------------------------------------------------------------- LIKE */

check('LIKE: % och _ och \\ escapas', escapeLike('50%_a\\b'), '50\\%\\_a\\\\b')
check('LIKE: mönster', containsPattern('gryta'), '%gryta%')
check('LIKE: mönster med joker', containsPattern('a%b'), '%a\\%b%')

/* ------------------------------------------------------------------ slut */

if (failed > 0) {
  console.error(`\n${failed} test misslyckades.`)
  process.exit(1)
}
console.log('\nAlla tester gröna.')
