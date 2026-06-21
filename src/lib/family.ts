import { randomBytes } from 'crypto'
import { cookies, headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { getBearerUserId } from '@/lib/mobile-auth'
import { DEFAULT_CATEGORIES } from '@/lib/categories'

export const ACTIVE_FAMILY_COOKIE = 'vadskavi-active-family'

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase() // 8 tecken
}

/** Skapa en ny gemenskap åt användaren (med standardkategorier) och returnera id. */
export async function createFamilyForUser(userId: string, name: string): Promise<string> {
  const family = await prisma.$transaction(async (tx) => {
    const fam = await tx.family.create({
      data: {
        name: name.trim() || 'Min gemenskap',
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
 * Användarens standardgemenskap (för nya recept). Suspenderade gemenskaper räknas
 * inte. Cookie väljer bland aktiva; saknas aktiv skapas en ny.
 */
export async function getDefaultFamily(userId: string): Promise<string> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { family: { select: { status: true } } },
    orderBy: { joinedAt: 'asc' },
  })
  const active = memberships.filter((m) => m.family.status !== 'suspended')
  if (active.length === 0) {
    return createFamilyForUser(userId, 'Min gemenskap')
  }
  // Mobil-appen väljer aktiv gemenskap via `x-family-id`-header; webben via cookie.
  const hdrs = await headers()
  const cookieStore = await cookies()
  const preferred = hdrs.get('x-family-id') || cookieStore.get(ACTIVE_FAMILY_COOKIE)?.value
  if (preferred && active.some((m) => m.familyId === preferred)) {
    return preferred
  }
  return active[0].familyId
}

/** Bakåtkompatibelt alias. */
export const getActiveFamily = getDefaultFamily

/** Alla aktiva gemenskaper användaren tillhör (auto-skapar en om ingen finns). */
export async function getUserFamilies(
  userId: string,
): Promise<{ id: string; name: string; role: string }[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { family: { select: { id: true, name: true, status: true } } },
    orderBy: { joinedAt: 'asc' },
  })
  if (memberships.length === 0) {
    await createFamilyForUser(userId, 'Min gemenskap')
    return getUserFamilies(userId)
  }
  return memberships
    .filter((m) => m.family.status !== 'suspended')
    .map((m) => ({ id: m.family.id, name: m.family.name, role: m.role }))
}

/** Id för alla användarens aktiva gemenskaper. */
export async function userFamilyIds(userId: string): Promise<string[]> {
  return (await getUserFamilies(userId)).map((f) => f.id)
}

/** Kastar om användaren inte är medlem i gemenskapen. */
export async function assertMember(userId: string, familyId: string): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: { userId_familyId: { userId, familyId } },
  })
  if (!membership) throw new Error('FORBIDDEN')
}

/** Kräver inloggad användare; returnerar userId + standardgemenskap. */
export async function requireFamily(): Promise<{ userId: string; familyId: string }> {
  const userId = await requireUser()
  const familyId = await getDefaultFamily(userId)
  return { userId, familyId }
}

/** Kräver inloggad användare; returnerar userId. */
export async function requireUser(): Promise<string> {
  // Mobil-app: Bearer-token har företräde. Faller tillbaka på NextAuth-cookie (webben).
  const bearerUserId = await getBearerUserId()
  if (bearerUserId) return bearerUserId
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED')
  }
  return session.user.id
}

/**
 * Bootstrap-admins via env: ADMIN_EMAILS=thomas@schiffer.se,annan@exempel.se
 * (kommaseparerad). Låter ägaren bli admin utan SQL — sätt variabeln i
 * .env.vadskavi på servern. Övriga admins kan sedan hanteras i /admin.
 */
export function isEnvAdmin(email?: string | null): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

/** Kräver inloggad admin; returnerar userId. */
export async function requireAdmin(): Promise<string> {
  const userId = await requireUser()
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, email: true },
  })
  if (u?.isAdmin) return userId
  // Env-admin: släpp in och befordra till riktig DB-admin första gången, så att
  // hen kan hantera andra användare i admin-vyn.
  if (isEnvAdmin(u?.email)) {
    await prisma.user.update({ where: { id: userId }, data: { isAdmin: true } })
    return userId
  }
  throw new Error('FORBIDDEN')
}
