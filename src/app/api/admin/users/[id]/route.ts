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
  const data: { plan?: string; isAdmin?: boolean } = {}
  if ('plan' in body) {
    if (body.plan !== 'free' && body.plan !== 'paid') {
      return NextResponse.json({ error: 'Ogiltig plan' }, { status: 400 })
    }
    data.plan = body.plan
  }
  if ('isAdmin' in body) data.isAdmin = !!body.isAdmin
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Inget att uppdatera' }, { status: 400 })
  }
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, plan: true, isAdmin: true },
  })
  return NextResponse.json(user)
}
