/**
 * Rena tester för src/lib/registration.ts och src/lib/rate-limit.ts. Körs med `npm run test:registration`.
 * Ingen DB, inget nät.
 */
import { NextRequest } from 'next/server'
import { defaultFamilyName, validateRegistration } from '../src/lib/registration'
import { clientIp, createRateLimiter } from '../src/lib/rate-limit'
import { ownershipUpdate } from '../src/lib/email-ownership'

let failed = 0
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) {
    failed++
    console.error(`✗ ${name}\n    förväntat: ${JSON.stringify(expected)}\n    fick:      ${JSON.stringify(actual)}`)
  } else console.log(`✓ ${name}`)
}

const good = { name: '  Thomas   Schiffer ', email: ' Thomas@Schiffer.SE ', password: 'hemligt123' }
check('giltig: normaliserar namn och e-post, rör inte lösenordet', validateRegistration(good), {
  ok: true,
  value: { name: 'Thomas Schiffer', email: 'thomas@schiffer.se', password: 'hemligt123' },
})
check('namn krävs', validateRegistration({ ...good, name: '   ' }), { ok: false, error: 'Skriv ditt namn' })
check('för långt namn', validateRegistration({ ...good, name: 'x'.repeat(81) }), { ok: false, error: 'Namnet är för långt' })
check('ogiltig e-post', validateRegistration({ ...good, email: 'thomas@' }), { ok: false, error: 'Ange en giltig e-postadress' })
check('för kort lösenord', validateRegistration({ ...good, password: '1234567' }), {
  ok: false,
  error: 'Lösenordet måste vara minst 8 tecken',
})
// Lösenordet trimmas inte: ett mellanslag som användaren skrev är en del av lösenordet,
// och inloggningen (/api/mobile/login) jämför det otrimmade värdet.
check('lösenord med mellanslag behålls exakt', validateRegistration({ ...good, password: ' abc defg ' }).ok, true)
check('fel typer ⇒ fel, ingen krasch', validateRegistration({ name: 1, email: [], password: null }).ok, false)
check('null-kropp ⇒ fel, ingen krasch', validateRegistration(null).ok, false)

check('familjenamn av efternamn', defaultFamilyName('Thomas Schiffer'), 'Familjen Schiffer')
check('familjenamn med mellannamn', defaultFamilyName('Anna Maria Ek'), 'Familjen Ek')
check('ett ord ⇒ standardnamn', defaultFamilyName('Thomas'), 'Min gemenskap')

// Pre-hijacking: ett lösenord satt innan adressen bevisats ska bort när ägaren loggar in.
const hijacked = ownershipUpdate({ emailVerified: null, password: 'angriparens-hash' })
check('overifierat konto: lösenordet nollställs', hijacked?.password, null)
check('overifierat konto: markeras verifierat', hijacked?.emailVerified instanceof Date, true)
check('verifierat konto: lösenordet rörs inte', ownershipUpdate({ emailVerified: new Date(), password: 'hash' }), null)

const limited = createRateLimiter(2, 60_000)
check('takbegränsning: två släpps, tredje stoppas', [limited('a'), limited('a'), limited('a')], [false, false, true])
check('takbegränsning: per nyckel', limited('b'), false)

const req = (h: Record<string, string>) => new NextRequest('https://vadskavi.nu/api/register', { headers: h })
check('ip: x-real-ip vinner', clientIp(req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' })), '1.1.1.1')
// En bot kan skicka egen x-forwarded-for; proxyn lägger till sin observation SIST.
check('ip: sista x-forwarded-for-hoppet, inte det förfalskbara första', clientIp(req({ 'x-forwarded-for': '6.6.6.6, 2.2.2.2' })), '2.2.2.2')
check('ip: inga headers', clientIp(req({})), 'okänd')

if (failed) {
  console.error(`\n${failed} test(er) misslyckades`)
  process.exit(1)
}
console.log('\nAlla registreringstester gröna')
