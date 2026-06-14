import { NextRequest, NextResponse } from 'next/server'
import { requireFamily } from '@/lib/family'
import { saveImage } from '@/lib/images'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  try {
    await requireFamily()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const formData = await request.formData()
  const files = formData.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ error: 'Inga filer skickades' }, { status: 400 })
  }

  const filenames: string[] = []
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Filen ${file.name} är för stor (max 10 MB)` },
        { status: 400 },
      )
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    filenames.push(await saveImage(buffer))
  }

  return NextResponse.json({ filenames })
}
