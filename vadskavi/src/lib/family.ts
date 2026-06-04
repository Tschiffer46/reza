import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { DEFAULT_CATEGORIES } from '@/lib/categories'

export const ACTIVE_FAMILY_COOKIE = 'vadskavi-active-family'

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase() // 8 tecken
}

/** Skapa en ny familj åt användaren (med standardkategorier) och returnera id. */
export async function createFamilyForUser(userId: string, name: string): Promise<string> {
  const family = await prisma.$transaction(async (tx) => {
    const fam = await tx.family.create({
      data: {
        name: name.trim() || 'Min familj',
        inviteCode: generateInviteCode(),
        createdById: userId,
      },
    })
    await tx.membership.create({ data: { userId, familyId: fam.id, role: 'admin' } })
    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ name: c.name, type: c.type, familyId: fam.id })),
    })
    return fam
  })
  return family.id
}

/**
 * Returnerar användarens aktiva familj. Väljs via cookie om den pekar på en
 * giltig membership, annars första familjen. Saknas familj skapas en automatiskt.
 */
export async function getActiveFamily(userId: string): Promise<string> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
  })
  if (memberships.length === 0) {
    return createFamilyForUser(userId, 'Min familj')
  }
  const cookieStore = await cookies()
  const preferred = cookieStore.get(ACTIVE_FAMILY_COOKIE)?.value
  if (preferred && memberships.some((m) => m.familyId === preferred)) {
    return preferred
  }
  return memberships[0].familyId
}

/** Kräver inloggad användare; returnerar userId + aktiv familj. */
export async function requireFamily(): Promise<{ userId: string; familyId: string }> {
  const userId = await requireUser()
  const familyId = await getActiveFamily(userId)
  return { userId, familyId }
}

/** Kräver inloggad användare; returnerar userId. */
export async function requireUser(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED')
  }
  return session.user.id
}
