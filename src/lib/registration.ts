// Validering för kontoskapande i mobil-appen (POST /api/mobile/register). Ren funktion
// utan databas ⇒ testbar med `npm run test:registration`.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const MIN_PASSWORD = 8
const MAX_NAME = 80

export type RegistrationInput = { name: string; email: string; password: string }
export type RegistrationResult =
  | { ok: true; value: RegistrationInput }
  | { ok: false; error: string }

export function validateRegistration(body: unknown): RegistrationResult {
  const b = (body ?? {}) as Record<string, unknown>
  const name = typeof b.name === 'string' ? b.name.trim().replace(/\s+/g, ' ') : ''
  const email = typeof b.email === 'string' ? b.email.toLowerCase().trim() : ''
  const password = typeof b.password === 'string' ? b.password : ''

  // Namnet krävs här (inte på webben): appen hälsar med förnamn och ritar familjefärger
  // med initial — ett konto utan namn blir "?" överallt.
  if (!name) return { ok: false, error: 'Skriv ditt namn' }
  if (name.length > MAX_NAME) return { ok: false, error: 'Namnet är för långt' }
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Ange en giltig e-postadress' }
  if (password.length < MIN_PASSWORD) {
    return { ok: false, error: `Lösenordet måste vara minst ${MIN_PASSWORD} tecken` }
  }
  return { ok: true, value: { name, email, password } }
}

/** "Thomas Schiffer" → "Familjen Schiffer" (samma förslag som webbens /onboarding). */
export function defaultFamilyName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? `Familjen ${parts[parts.length - 1]}` : 'Min gemenskap'
}
