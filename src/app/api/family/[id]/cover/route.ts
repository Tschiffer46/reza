import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/family'
import { saveImage, deleteImage } from '@/lib/images'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId
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

  // Byta omslagsbild är en Premium-förmån.
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  if (me?.plan !== 'paid') {
    return NextResponse.json({ error: 'Premium krävs för att byta omslag' }, { status: 402 })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Ingen fil' }, { status: 400 })
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = await saveImage(buffer)

  const existing = await prisma.family.findUnique({ where: { id }, select: { coverImage: true } })
  await prisma.family.update({ where: { id }, data: { coverImage: filename } })
  if (existing?.coverImage) await deleteImage(existing.coverImage)

  return NextResponse.json({ coverImage: filename })
}
