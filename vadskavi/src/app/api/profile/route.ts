import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'

export async function PATCH(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { name } = await request.json()
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: name && name.trim() ? name.trim() : null },
    select: { name: true, email: true },
  })
  return NextResponse.json(user)
}
