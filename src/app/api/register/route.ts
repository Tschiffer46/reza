import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { email: rawEmail, password, name } = await request.json()
  const email = String(rawEmail ?? '').toLowerCase().trim()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ange en giltig e-postadress' }, { status: 400 })
  }
  if (!password || String(password).length < 8) {
    return NextResponse.json({ error: 'Lösenordet måste vara minst 8 tecken' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(String(password), 10)
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    if (existing.password) {
      return NextResponse.json({ error: 'Ett konto med den e-posten finns redan' }, { status: 409 })
    }
    // Magic-link-användare utan lösenord → sätt lösenord
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed, ...(name?.trim() ? { name: name.trim() } : {}) },
    })
  } else {
    await prisma.user.create({
      data: { email, password: hashed, name: name?.trim() || null },
    })
  }

  return NextResponse.json({ ok: true })
}
