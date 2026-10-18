import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { signMobileToken } from '@/lib/mobile-auth'
import { createFamilyForUser, getDefaultFamily, getUserFamilies } from '@/lib/family'
import { defaultFamilyName, validateRegistration } from '@/lib/registration'

/**
 * POST /api/mobile/register — skapa konto med e-post + lösenord i mobil-appen.
 *
 * `{ name, email, password }` → samma svar som /api/mobile/login
 * (`{ token, user, families, activeFamilyId }`), så appen loggas in direkt.
 * Publik route (PUBLIC_PATHS i src/middleware.ts).
 *
 * Skiljer sig MEDVETET från webbens /api/register på en punkt: finns e-postadressen
 * redan svarar vi 409 även om kontot saknar lösenord. Webben sätter då lösenordet på det
 * befintliga kontot — men konton från Apple-inloggning och magic link saknar lösenord,
 * så vem som helst som känner till adressen skulle kunna ta över kontot den vägen.
 */

// Enkel takbegränsning i minnet per IP (en container bakom NPM, samma resonemang som
// /api/waitlist). Skyddar mot massregistrering och mot att sondera vilka adresser som finns.
const MAX_PER_WINDOW = 5
const WINDOW_MS = 15 * 60 * 1000
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  for (const [key, entry] of hits) if (now > entry.resetAt) hits.delete(key)
  const entry = hits.get(ip)
  if (!entry) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_PER_WINDOW
}

/** Proxyns x-real-ip, annars SISTA x-forwarded-for-hoppet (se /api/waitlist för varför). */
function clientIp(request: NextRequest): string {
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  const hops = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return hops.length ? hops[hops.length - 1] : 'okänd'
}

const EXISTS =
  'Det finns redan ett konto med den e-postadressen. Logga in, eller välj Fortsätt med Apple om du skapade kontot så.'

export async function POST(request: NextRequest) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: 'För många försök. Vänta en stund och prova igen.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }

  const parsed = validateRegistration(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { name, email, password } = parsed.value

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: EXISTS }, { status: 409 })
  }

  let userId: string
  try {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        password: await bcrypt.hash(password, 10),
        // Gemenskapen skapas nedan ⇒ webbens /onboarding behöver inte fråga igen.
        onboardedAt: new Date(),
      },
      select: { id: true },
    })
    userId = created.id
  } catch (e) {
    // Två samtidiga registreringar med samma adress: unik-constrainten avgör.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: EXISTS }, { status: 409 })
    }
    throw e
  }

  // En gemenskap med ett riktigt namn i stället för getDefaultFamilys "Min gemenskap".
  await createFamilyForUser(userId, defaultFamilyName(name))

  const token = signMobileToken(userId)
  const activeFamilyId = await getDefaultFamily(userId)
  const families = await getUserFamilies(userId)

  return NextResponse.json(
    { token, user: { id: userId, email, name }, families, activeFamilyId },
    { status: 201 },
  )
}
