import { NextRequest, NextResponse } from 'next/server'
import { saveImage } from '@/lib/images'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const files = formData.getAll('files') as File[]

  if (files.length === 0) {
    return NextResponse.json({ error: 'Inga filer skickades' }, { status: 400 })
  }

  const filenames: string[] = []

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Filen ${file.name} är för stor (max 10MB)` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = await saveImage(buffer)
    filenames.push(filename)
  }

  return NextResponse.json({ filenames })
}
