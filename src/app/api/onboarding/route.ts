import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ACTIVE_FAMILY_COOKIE, requireUser, getDefaultFamily } from '@/lib/family'

/** Slutför onboarding: skapa (namnge) en gemenskap, gå med via kod, eller hoppa över. */
export async function POST(request: NextRequest) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { action, name, code } = await request.json()
  const res = NextResponse.json({ ok: true })

  if (action === 'join') {
    const family = await prisma.family.findUnique({ where: { inviteCode: String(code || '').trim().toUpperCase() } })
    if (!family) {
      return NextResponse.json({ error: 'Ogiltig kod' }, { status: 404 })
    }
    const existing = await prisma.membership.findUnique({ where: { userId_familyId: { userId, familyId: family.id } } })
    if (!existing) {
      await prisma.membership.create({ data: { userId, familyId: family.id, role: 'member' } })
    }
    res.cookies.set(ACTIVE_FAMILY_COOKIE, family.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
  } else if (action === 'create' && name && name.trim()) {
    // Döp om den auto-skapade gemenskapen till valt namn
    const familyId = await getDefaultFamily(userId)
    await prisma.family.update({ where: { id: familyId }, data: { name: name.trim() } })
  }

  await prisma.user.update({ where: { id: userId }, data: { onboardedAt: new Date() } })
  return res
}
