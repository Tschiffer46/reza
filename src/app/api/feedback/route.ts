import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'

const TYPES = ['bug', 'idea', 'other']

/** Användare skickar feedback — sparas i DB och visas i admin. */
export async function POST(request: NextRequest) {
  let userId: string
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { type, message } = await request.json()
  const text = String(message || '').trim()
  if (!text) {
    return NextResponse.json({ error: 'Skriv ett meddelande' }, { status: 400 })
  }

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  const feedback = await prisma.feedback.create({
    data: {
      userId,
      email: me?.email ?? null,
      type: TYPES.includes(type) ? type : 'other',
      message: text.slice(0, 4000),
    },
  })
  return NextResponse.json({ id: feedback.id })
}
