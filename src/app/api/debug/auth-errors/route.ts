import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthErrors } from '@/lib/auth-debug'

// TILLFÄLLIG diagnostikroute. Skyddad av en hemlig nyckel i query-strängen.
// Tas bort när OAuth-felsökningen är klar.
const KEY = 'vsk-9q2m7xK4'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== KEY) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // Finns image-kolumnen i körande databas?
  let imageColumn: string
  try {
    await prisma.user.findFirst({ select: { id: true, image: true } })
    imageColumn = 'ok'
  } catch (e) {
    imageColumn = (e as { message?: string })?.message ?? String(e)
  }

  // Finns Feedback-tabellen (db push körd)?
  let feedbackTable: string
  try {
    await prisma.feedback.count()
    feedbackTable = 'ok'
  } catch (e) {
    feedbackTable = (e as { message?: string })?.message ?? String(e)
  }

  let userCount: number | string
  try {
    userCount = await prisma.user.count()
  } catch (e) {
    userCount = (e as { message?: string })?.message ?? String(e)
  }

  return NextResponse.json({
    checks: { imageColumn, feedbackTable, userCount },
    authErrors: getAuthErrors(),
  })
}
