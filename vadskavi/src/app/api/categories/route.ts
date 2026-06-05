import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, getDefaultFamily, userFamilyIds, assertMember } from '@/lib/family'

export async function GET(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const type = sp.get('type')
  const family = sp.get('family')
  const familyIds = await userFamilyIds(userId)
  const scope = family && familyIds.includes(family) ? [family] : familyIds

  const categories = await prisma.category.findMany({
    where: { familyId: { in: scope }, ...(type ? { type } : {}) },
    orderBy: { name: 'asc' },
  })

  // Vid union över flera familjer: deduplicera på namn+typ.
  if (scope.length > 1) {
    const seen = new Set<string>()
    const deduped = categories.filter((c) => {
      const key = `${c.type}:${c.name.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return NextResponse.json(deduped)
  }
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  let userId
  try {
    userId = await requireUser()
  } catch {
    return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  }

  const { name, type, family } = await request.json()
  if (!name || !name.trim() || (type !== 'recipe' && type !== 'tip')) {
    return NextResponse.json({ error: 'Ange namn och giltig typ' }, { status: 400 })
  }

  let familyId = family as string | undefined
  if (familyId) {
    try {
      await assertMember(userId, familyId)
    } catch {
      return NextResponse.json({ error: 'Du tillhör inte den familjen' }, { status: 403 })
    }
  } else {
    familyId = await getDefaultFamily(userId)
  }

  const existing = await prisma.category.findFirst({
    where: { familyId, name: name.trim(), type },
  })
  if (existing) {
    return NextResponse.json(existing, { status: 200 })
  }

  const category = await prisma.category.create({
    data: { name: name.trim(), type, familyId },
  })
  return NextResponse.json(category, { status: 201 })
}
