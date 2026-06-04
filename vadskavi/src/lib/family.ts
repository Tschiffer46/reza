import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { DEFAULT_CATEGORIES } from '@/lib/categories'

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase() // 8 tecken
}

/**
 * Returnerar användarens aktiva familj-id. Saknar användaren familj skapas en
 * automatiskt (med standardkategorier) — full inbjudnings-onboarding kommer senare.
 */
export async function getActiveFamily(userId: string): Promise<string> {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
  })
  if (membership) return membership.familyId

  const family = await prisma.$transaction(async (tx) => {
    const fam = await tx.family.create({
      data: {
        name: 'Min familj',
        inviteCode: generateInviteCode(),
        createdById: userId,
      },
    })
    await tx.membership.create({
      data: { userId, familyId: fam.id, role: 'admin' },
    })
    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        name: c.name,
        type: c.type,
        familyId: fam.id,
      })),
    })
    return fam
  })
  return family.id
}

/** Kastar om användaren inte är inloggad; annars ger den userId + aktiv familj. */
export async function requireFamily(): Promise<{ userId: string; familyId: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED')
  }
  const familyId = await getActiveFamily(session.user.id)
  return { userId: session.user.id, familyId }
}
