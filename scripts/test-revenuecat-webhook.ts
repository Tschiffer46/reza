/**
 * Fristående tester för händelsemappningen i RevenueCat-webhooken.
 * Körs med `npm run test:webhook`. Ingen testrunner, ingen databas, inget nät —
 * `mapWebhookEvent` är en ren funktion just för att kunna testas så här.
 *
 * Det viktigaste testet är att CANCELLATION INTE tar bort premium. I RevenueCat betyder
 * det bara att autoförnyelsen stängts av; kunden har kvar sin betalda period. Att råka
 * lägga den bland revoke-händelserna stänger av folk som betalat — därför ett test.
 */
import { mapWebhookEvent, type PlanChange } from '../src/lib/revenuecat'

let failed = 0

function check(name: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`✓ ${name}`)
    return
  }
  failed++
  console.error(
    `✗ ${name}\n    förväntat: ${JSON.stringify(expected)}\n    fick:      ${JSON.stringify(actual)}`,
  )
}

function checkKind(name: string, change: PlanChange, kind: PlanChange['kind']) {
  if (change.kind === kind) {
    console.log(`✓ ${name}`)
    return
  }
  failed++
  console.error(`✗ ${name}\n    förväntad kind: ${kind}\n    fick:           ${JSON.stringify(change)}`)
}

/** Bygg en RevenueCat-payload (nästlad under `event`, som deras riktiga format). */
const evt = (type: string, extra: Record<string, unknown> = {}) => ({
  api_version: '1.0',
  event: { type, id: 'evt_1', app_user_id: 'user_123', entitlement_ids: ['premium'], ...extra },
})

/* ------------------------------------------------- händelser som GER premium */

for (const type of [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
]) {
  check(`${type} → paid`, mapWebhookEvent(evt(type)), {
    kind: 'set',
    userIds: ['user_123'],
    plan: 'paid',
  })
}

/* ---------------------------------------------- händelser som TAR BORT premium */

check('EXPIRATION → free', mapWebhookEvent(evt('EXPIRATION')), {
  kind: 'set',
  userIds: ['user_123'],
  plan: 'free',
})

/* ------------------------------------- REGRESSIONSSKYDD: dessa får INTE ge free */

// Kunden har stängt av autoförnyelsen men betalat för perioden — access ska vara kvar
// tills EXPIRATION kommer. Detta är buggen som fanns i den gamla Purchasely-mappningen.
checkKind('CANCELLATION rör inte planen', mapWebhookEvent(evt('CANCELLATION')), 'ignore')
checkKind('BILLING_ISSUE rör inte planen', mapWebhookEvent(evt('BILLING_ISSUE')), 'ignore')
checkKind('SUBSCRIPTION_PAUSED rör inte planen', mapWebhookEvent(evt('SUBSCRIPTION_PAUSED')), 'ignore')
checkKind('TEST rör inte planen', mapWebhookEvent(evt('TEST')), 'ignore')
checkKind('okänd händelsetyp rör inte planen', mapWebhookEvent(evt('NÅGOT_NYTT')), 'ignore')

/* ---------------------------------------------------------------- TRANSFER */

check(
  'TRANSFER flyttar premium mellan konton',
  mapWebhookEvent({
    api_version: '1.0',
    event: { type: 'TRANSFER', transferred_from: ['gammal'], transferred_to: ['ny'] },
  }),
  { kind: 'transfer', from: ['gammal'], to: ['ny'] },
)
checkKind(
  'TRANSFER utan id:n ignoreras',
  mapWebhookEvent({ api_version: '1.0', event: { type: 'TRANSFER' } }),
  'ignore',
)

/* -------------------------------------------------- utgångstid och robusthet */

checkKind(
  'omspelad händelse med utgången expiration ger inte premium',
  mapWebhookEvent(evt('RENEWAL', { expiration_at_ms: Date.now() - 60_000 })),
  'ignore',
)
check(
  'framtida expiration ger premium',
  mapWebhookEvent(evt('RENEWAL', { expiration_at_ms: Date.now() + 60_000 })),
  { kind: 'set', userIds: ['user_123'], plan: 'paid' },
)

checkKind('tom payload ignoreras', mapWebhookEvent(null), 'ignore')
checkKind('payload utan event ignoreras', mapWebhookEvent({ api_version: '1.0' }), 'ignore')
checkKind(
  'händelse utan app_user_id ignoreras',
  mapWebhookEvent({ api_version: '1.0', event: { type: 'RENEWAL' } }),
  'ignore',
)
check(
  'gemener i type hanteras',
  mapWebhookEvent({ api_version: '1.0', event: { type: 'renewal', app_user_id: 'user_123' } }),
  { kind: 'set', userIds: ['user_123'], plan: 'paid' },
)

/* ------------------------------------------------------------------ slut */

if (failed > 0) {
  console.error(`\n${failed} test misslyckades.`)
  process.exit(1)
}
console.log('\nAlla tester gröna.')
