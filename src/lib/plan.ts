import { prisma } from '@/lib/db'

/** Gratisanvändare får skapa max så här många recept/tips per kalendermånad. */
export const FREE_MONTHLY_LIMIT = 3

export function monthStart(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Antal entries användaren skapat innevarande månad. */
export function monthlyEntryCount(userId: string): Promise<number> {
  return prisma.entry.count({ where: { creatorId: userId, createdAt: { gte: monthStart() } } })
}
