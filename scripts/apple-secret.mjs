// Genererar Apples "client secret" (signerad ES256-JWT) för Sign in with Apple.
// Apple-hemligheten är giltig i max 6 månader och måste förnyas — kör om scriptet då.
//
// Användning (från projektroten, med din nedladdade AuthKey_XXXX.p8):
//   APPLE_TEAM_ID=ABCDE12345 \
//   APPLE_KEY_ID=KEY1234567 \
//   APPLE_SERVICES_ID=nu.vadskavi.web \
//   APPLE_P8=./AuthKey_KEY1234567.p8 \
//   npm run apple-secret
//
// Klistra in den utskrivna strängen som AUTH_APPLE_SECRET i .env.vadskavi.

import { readFileSync } from 'node:fs'
import { createSign } from 'node:crypto'

const { APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_SERVICES_ID, APPLE_P8 } = process.env

const missing = ['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_SERVICES_ID', 'APPLE_P8'].filter(
  (k) => !process.env[k],
)
if (missing.length) {
  console.error('Saknar miljövariabler: ' + missing.join(', '))
  console.error('Se kommentaren överst i scripts/apple-secret.mjs för exempel.')
  process.exit(1)
}

let key
try {
  key = readFileSync(APPLE_P8, 'utf8')
} catch {
  console.error(`Kunde inte läsa nyckelfilen: ${APPLE_P8}`)
  process.exit(1)
}

const now = Math.floor(Date.now() / 1000)
const SIX_MONTHS = 60 * 60 * 24 * 180
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')

const header = b64({ alg: 'ES256', kid: APPLE_KEY_ID })
const payload = b64({
  iss: APPLE_TEAM_ID,
  iat: now,
  exp: now + SIX_MONTHS,
  aud: 'https://appleid.apple.com',
  sub: APPLE_SERVICES_ID,
})

const signer = createSign('SHA256')
signer.update(`${header}.${payload}`)
// ieee-p1363 ger r||s-format som JWT ES256 kräver (inte DER).
const signature = signer.sign({ key, dsaEncoding: 'ieee-p1363' }).toString('base64url')

const token = `${header}.${payload}.${signature}`
console.log('\nAUTH_APPLE_SECRET (giltig ~6 mån, förnya sedan):\n')
console.log(token)
console.log('')
