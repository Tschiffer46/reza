import { NextRequest, NextResponse } from 'next/server'
import { checkPassword, setSessionCookie, clearSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password } = body

  if (!password || !checkPassword(password)) {
    return NextResponse.json({ error: 'Fel lösenord' }, { status: 401 })
  }

  await setSessionCookie()
  return NextResponse.json({ success: true })
}

export async function DELETE() {
  await clearSessionCookie()
  return NextResponse.json({ success: true })
}
