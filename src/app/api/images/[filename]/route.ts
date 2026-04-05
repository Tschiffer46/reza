import { NextRequest, NextResponse } from 'next/server'
import { readImage } from '@/lib/images'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Only allow .webp files with UUID-like names
  if (!filename.endsWith('.webp') || filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Ogiltig fil' }, { status: 400 })
  }

  const buffer = await readImage(filename)
  if (!buffer) {
    return NextResponse.json({ error: 'Filen hittades inte' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
