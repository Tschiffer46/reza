import { NextRequest, NextResponse } from 'next/server'
import { requireFamily } from '@/lib/family'
import { extractFromText, extractFromImage } from '@/lib/ai'
import { prepareForClaude } from '@/lib/images'

export async function POST(request: NextRequest) {
  try {
    await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''

    // Bild-extraktion (multipart) — input-only, sparas inte
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const files = form.getAll('files').filter((f): f is File => f instanceof File)
      const images: { base64: string; mediaType: string }[] = []
      for (const file of files.slice(0, 3)) {
        const buffer = Buffer.from(await file.arrayBuffer())
        images.push(await prepareForClaude(buffer))
      }
      if (images.length === 0) {
        return NextResponse.json({ error: 'Ingen bild skickades' }, { status: 400 })
      }
      const result = await extractFromImage(images)
      return NextResponse.json(result)
    }

    // Text-extraktion (JSON)
    const { text } = await request.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Skicka text eller bild' }, { status: 400 })
    }
    const result = await extractFromText(text)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraheringen misslyckades'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
