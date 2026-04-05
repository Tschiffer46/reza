import { NextRequest, NextResponse } from 'next/server'
import { extractFromText, extractFromImage } from '@/lib/claude'
import { readImage } from '@/lib/images'
import { prepareForClaude } from '@/lib/images'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { text, imageFilenames, url } = body

  try {
    // Text extraction
    if (text) {
      const result = await extractFromText(text)
      return NextResponse.json(result)
    }

    // Image extraction
    if (imageFilenames && imageFilenames.length > 0) {
      const images: { base64: string; mediaType: string }[] = []

      for (const filename of imageFilenames.slice(0, 3)) {
        const buffer = await readImage(filename)
        if (buffer) {
          const prepared = await prepareForClaude(buffer)
          images.push(prepared)
        }
      }

      if (images.length === 0) {
        return NextResponse.json({ error: 'Inga bilder hittades' }, { status: 400 })
      }

      const result = await extractFromImage(images)
      return NextResponse.json(result)
    }

    // URL extraction — fetch page text, then extract
    if (url) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Reza Recipe Collector/1.0' },
      })
      if (!response.ok) {
        return NextResponse.json({ error: 'Kunde inte hämta URL:en' }, { status: 400 })
      }

      const html = await response.text()
      // Strip HTML tags, keep text
      const plainText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000) // Limit to save tokens

      const result = await extractFromText(plainText)
      result.source = result.source || new URL(url).hostname
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Skicka text, bilder eller URL' }, { status: 400 })
  } catch (error) {
    console.error('Extract error:', error)
    const message = error instanceof Error ? error.message : 'Extraheringen misslyckades'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
