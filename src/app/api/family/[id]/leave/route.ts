import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'

/**
 * POST /api/family/[id]/leave — lämna en gemenskap.
 *
 * Raderar callerns medlemskap. Sista medlemmen får lämna (en tom gemenskap är
 * ofarlig). Klienten hämtar om familjelistan efteråt — saknas aktiva medlemskap
 * auto-skapar getUserFamilies/getDefaultFamily en ny gemenskap.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { id } = await params
  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId: id } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Du är inte medlem i den gemenskapen' }, { status: 403 })
  }

  await prisma.membership.delete({ where: { id: membership.id } })
  return NextResponse.json({ ok: true })
}
