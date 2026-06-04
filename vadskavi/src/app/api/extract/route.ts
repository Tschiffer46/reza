import { NextRequest, NextResponse } from 'next/server'
import { requireFamily } from '@/lib/family'
import { extractFromText, extractFromImage } from '@/lib/ai'
import { extractFromUrl } from '@/lib/url-extract'
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

    // Text- eller URL-extraktion (JSON)
    const body = await request.json()
    if (body.url && body.url.trim()) {
      const result = await extractFromUrl(body.url.trim())
      return NextResponse.json(result)
    }
    if (body.text && body.text.trim()) {
      const result = await extractFromText(body.text)
      return NextResponse.json(result)
    }
    return NextResponse.json({ error: 'Skicka text, länk eller bild' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraheringen misslyckades'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
