import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'

export async function PATCH(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { password } = await request.json()
  if (!password || String(password).length < 8) {
    return NextResponse.json({ error: 'Lösenordet måste vara minst 8 tecken' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(String(password), 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
  return NextResponse.json({ ok: true })
}
