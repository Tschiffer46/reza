import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Du ar en receptextraherings-assistent. Du far en text som innehaller FLERA recept och/eller tips.

Dela upp texten i separata recept/tips och returnera en JSON-array.

Returnera EXAKT detta format, inget annat:
[
  {
    "type": "recipe" eller "tip",
    "title": "kort titel",
    "category": "en av kategorierna nedan",
    "ingredients": ["array av ingredienser, bara for recept, tom array for tips"],
    "instructions": "instruktioner steg for steg, bara for recept, null for tips",
    "content": "innehall, bara for tips, null for recept",
    "source": "kalla om den framgar, annars null"
  }
]

Kategorier for recept: Huvudratt, Forratt, Efterratt, Bakning, Sallad, Soppa, Frukost, Snacks, Dryck
Kategorier for tips: Matlagning, Forvaring, Kryddor, Redskap, Ovrigt

Regler:
- Svara BARA med JSON-array, ingen annan text
- Varje recept/tips ska bli ett separat objekt i arrayen
- Om det bara finns ett recept, returnera anda en array med ett element
- Skriv pa svenska`

export async function POST(request: NextRequest) {
  const { text } = await request.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text kravs' }, { status: 400 })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Ovantat svar' }, { status: 500 })
    }

    let cleaned = content.text.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    const entries = JSON.parse(cleaned)
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'Ogiltigt svar fran AI' }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Batch extract error:', error)
    const message = error instanceof Error ? error.message : 'Extraheringen misslyckades'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
