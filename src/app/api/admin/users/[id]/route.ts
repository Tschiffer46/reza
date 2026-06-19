import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/family'

/** Admin: växla en användares plan (free/paid) eller adminstatus. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json()
  const data: { plan?: string; isAdmin?: boolean; bonusCredits?: { increment: number } } = {}
  if ('plan' in body) {
    if (body.plan !== 'free' && body.plan !== 'paid') {
      return NextResponse.json({ error: 'Ogiltig plan' }, { status: 400 })
    }
    data.plan = body.plan
  }
  if ('isAdmin' in body) data.isAdmin = !!body.isAdmin
  if ('addCredits' in body) {
    const n = Math.trunc(Number(body.addCredits))
    if (!Number.isFinite(n) || n === 0) {
      return NextResponse.json({ error: 'Ogiltigt antal' }, { status: 400 })
    }
    data.bonusCredits = { increment: n }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Inget att uppdatera' }, { status: 400 })
  }
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, plan: true, isAdmin: true, bonusCredits: true },
  })
  return NextResponse.json(user)
}

/**
 * Admin: ta bort en användare. Vi inaktiverar och anonymiserar kontot i stället
 * för att radera raden — recept/betyg/kommentarer användaren bidragit med blir
 * kvar i gemenskaperna (annars förlorar andra medlemmar innehåll). Inloggning
 * stoppas (lösenord rensas, OAuth-konton + sessioner tas bort, e-posten frigörs)
 * och medlemskap avslutas.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  const { id } = await params
  if (id === adminId) {
    return NextResponse.json({ error: 'Du kan inte ta bort ditt eget konto' }, { status: 400 })
  }
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!target) {
    return NextResponse.json({ error: 'Användaren finns inte' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.account.deleteMany({ where: { userId: id } }),
    prisma.membership.deleteMany({ where: { userId: id } }),
    prisma.user.update({
      where: { id },
      data: {
        name: 'Borttagen användare',
        email: `borttagen+${id}@vadskavi.invalid`,
        password: null,
        avatar: null,
        image: null,
        bio: null,
        isAdmin: false,
        plan: 'free',
        bonusCredits: 0,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
