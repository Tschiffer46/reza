/**
 * Rena tester för src/lib/protein.ts och backfill-parsern. Körs med `npm run test:protein`.
 * Ingen DB, inget nät.
 */
import { PROTEINS, isProtein, normalizeProtein } from '../src/lib/protein'
import { normalizeEntry, AI_MODELS } from '../src/lib/ai'
import { BACKFILL_KEYS, BACKFILL_MODEL, parseBackfillResponse } from './backfill-protein-parse'

let failed = 0
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) {
    failed++
    console.error(`✗ ${name}\n    förväntat: ${JSON.stringify(expected)}\n    fick:      ${JSON.stringify(actual)}`)
  } else console.log(`✓ ${name}`)
}

check('kontraktets nycklar', PROTEINS.map((p) => p.key), ['beef', 'pork', 'chicken', 'fish', 'vegetarian', 'vegan', 'other'])
check('svenska etiketter', PROTEINS.map((p) => p.label), ['Nötkött', 'Fläsk', 'Kyckling', 'Fisk & skaldjur', 'Vegetariskt', 'Veganskt', 'Övrigt'])
check('backfill-nycklar = src-nycklar', [...BACKFILL_KEYS], PROTEINS.map((p) => p.key))
check('isProtein giltig', isProtein('fish'), true)
check('isProtein ogiltig', isProtein('lamb'), false)
check('normalize giltig', normalizeProtein('chicken'), 'chicken')
check('normalize versaler/blanksteg', normalizeProtein(' Chicken '), 'chicken')
check('normalize okänd (lamb) ⇒ null', normalizeProtein('lamb'), null)
check('normalize null/undefined/tal', [normalizeProtein(null), normalizeProtein(undefined), normalizeProtein(3)], [null, null, null])
check('normalize tom sträng', normalizeProtein(''), null)
check('normalizeEntry tar med protein', normalizeEntry({ title: 'x', protein: 'vegan' }).protein, 'vegan')
check('normalizeEntry saknat ⇒ null', normalizeEntry({ title: 'x' }).protein, null)
check('normalizeEntry skräp ⇒ null', normalizeEntry({ title: 'x', protein: 'meat' }).protein, null)

const ids = ['a1', 'b2', 'c3']
check('parse rent objekt', [...parseBackfillResponse('{"a1":"beef","b2":"fish"}', ids)], [['a1', 'beef'], ['b2', 'fish']])
check('parse med kodstaket', [...parseBackfillResponse('```json\n{"a1":"vegan"}\n```', ids)], [['a1', 'vegan']])
check('parse ogiltig nyckel släpps', [...parseBackfillResponse('{"a1":"lamb","b2":"pork"}', ids)], [['b2', 'pork']])
check('parse okänt id släpps', [...parseBackfillResponse('{"zzz":"beef"}', ids)], [])
check('parse null-värde släpps', [...parseBackfillResponse('{"a1":null}', ids)], [])
check('parse skräp ⇒ tom', parseBackfillResponse('Tyvärr kan jag inte', ids).size, 0)
check('parse array ⇒ tom', parseBackfillResponse('["beef"]', ids).size, 0)
check('parse versaler', [...parseBackfillResponse('{"c3":"Chicken"}', ids)], [['c3', 'chicken']])

// Skriptet har en egen kopia av modellnamnet (kan inte importera src/ i imagen).
check('backfill-modell = AI_MODELS.text', BACKFILL_MODEL, AI_MODELS.text)

if (failed > 0) {
  console.error(`\n${failed} test(er) föll`)
  process.exit(1)
}
console.log('\nAlla protein-tester gröna')
