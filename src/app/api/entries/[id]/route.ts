import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const entry = await prisma.entry.findUnique({ where: { id } })
  if (!entry) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  }
  return NextResponse.json(entry)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Handle "cooked" action
  if (body.action === 'cooked') {
    const entry = await prisma.entry.update({
      where: { id },
      data: {
        timesCooked: { increment: 1 },
        lastCooked: new Date(),
      },
    })
    return NextResponse.json(entry)
  }

  const { type, title, category, ingredients, instructions, content, source, url, notes, imageUrls } = body

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      type,
      title,
      category,
      ingredients: ingredients || [],
      instructions: instructions || undefined,
      content: content || undefined,
      source: source || undefined,
      url: url || undefined,
      notes: notes || undefined,
      imageUrls: imageUrls || undefined,
    },
  })

  return NextResponse.json(entry)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.entry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
