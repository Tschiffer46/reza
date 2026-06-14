import { NextRequest, NextResponse } from 'next/server'
import { requireFamily } from '@/lib/family'
import { extractBatchFromText } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  try {
    const { text } = await request.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Skicka text med ett eller flera recept' }, { status: 400 })
    }
    const results = await extractBatchFromText(text)
    return NextResponse.json({ entries: results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraheringen misslyckades'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
