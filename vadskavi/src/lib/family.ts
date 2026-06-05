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
 * Returnerar användarens standardfamilj (för nya recept). Väljs via cookie om den
 * pekar på en giltig membership, annars första familjen. Saknas familj skapas en.
 */
export async function getDefaultFamily(userId: string): Promise<string> {
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

/** Bakåtkompatibelt alias. */
export const getActiveFamily = getDefaultFamily

/** Alla familjer användaren tillhör (auto-skapar en om ingen finns). */
export async function getUserFamilies(
  userId: string,
): Promise<{ id: string; name: string; role: string }[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { family: { select: { id: true, name: true } } },
    orderBy: { joinedAt: 'asc' },
  })
  if (memberships.length === 0) {
    await createFamilyForUser(userId, 'Min familj')
    return getUserFamilies(userId)
  }
  return memberships.map((m) => ({ id: m.family.id, name: m.family.name, role: m.role }))
}

/** Id för alla användarens familjer. */
export async function userFamilyIds(userId: string): Promise<string[]> {
  return (await getUserFamilies(userId)).map((f) => f.id)
}

/** Kastar om användaren inte är medlem i familjen. */
export async function assertMember(userId: string, familyId: string): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
  })
  if (!membership) throw new Error('FORBIDDEN')
}

/** Kräver inloggad användare; returnerar userId + standardfamilj. */
export async function requireFamily(): Promise<{ userId: string; familyId: string }> {
  const userId = await requireUser()
  const familyId = await getDefaultFamily(userId)
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
