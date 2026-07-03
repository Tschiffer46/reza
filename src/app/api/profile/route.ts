import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, deletedEmailFor } from '@/lib/family'
import { FREE_MONTHLY_LIMIT, monthlyEntryCount } from '@/lib/plan'
import { revokeAppleTokens } from '@/lib/apple-revoke'

export async function GET() {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, avatar: true, bio: true, plan: true },
  })
  // Plan + månadsanvändning så appen kan visa kvot/uppgradering (gratis = max FREE_MONTHLY_LIMIT).
  const count = await monthlyEntryCount(userId)
  return NextResponse.json({ ...user, usage: { count, limit: FREE_MONTHLY_LIMIT } })
}

export async function PATCH(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const body = await request.json()
  const data: { name?: string | null; bio?: string | null; avatar?: string | null } = {}
  if ('name' in body) data.name = body.name && String(body.name).trim() ? String(body.name).trim() : null
  if ('bio' in body) data.bio = body.bio && String(body.bio).trim() ? String(body.bio).trim() : null
  if ('avatar' in body) data.avatar = body.avatar ? String(body.avatar) : null

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { name: true, email: true, avatar: true, bio: true },
  })
  return NextResponse.json(user)
}

/**
 * Radera konto (App Store Guideline 5.1.1(v) kräver radering i appen).
 *
 * Strategi: User-raden ANONYMISERAS i stället för att raderas — recepten (och
 * kommentarer/betyg/"lagad av"-historik) stannar i gemenskapen attribuerade till
 * "Raderad användare", medan alla personuppgifter och inloggningsvägar tas bort.
 * Undviker samtidigt FK-problem (schemat saknar kaskader på Entry/Membership m.fl.)
 * och att gemenskapens receptbok töms när någon lämnar.
 */
export async function DELETE() {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  // Apple kräver token-revokering vid kontoradering (best effort, env-gated —
  // får aldrig stoppa raderingen).
  await revokeAppleTokens(userId)

  await prisma.$transaction([
    // Inloggningsvägar bort: OAuth-konton (inkl. Apple) + webbsessioner.
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    // Lämna alla gemenskaper.
    prisma.membership.deleteMany({ where: { userId } }),
    // Personligt innehåll bort: snack-inlägg (svar kaskadraderas), egna svar, anteckningar.
    prisma.postReply.deleteMany({ where: { authorId: userId } }),
    prisma.post.deleteMany({ where: { authorId: userId } }),
    prisma.note.deleteMany({ where: { authorId: userId } }),
    // Anonymisera användaren: e-posten görs obrukbar (unik per id), allt personligt nollas.
    prisma.user.update({
      where: { id: userId },
      data: {
        email: deletedEmailFor(userId),
        name: 'Raderad användare',
        avatar: null,
        image: null,
        bio: null,
        password: null,
        plan: 'free',
        isAdmin: false,
        snackSeenAt: null,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
