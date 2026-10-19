import { prisma } from '@/lib/db'

/**
 * Anropas när någon just har BEVISAT att den äger en e-postadress: klickat en e-postlänk,
 * eller loggat in med Apple/Google som har verifierat adressen.
 *
 * Skyddar mot "pre-hijacking": registreringen verifierar inte adressen, så vem som helst kan
 * skapa ett lösenordskonto med en annans adress *före* personen själv. När den riktiga ägaren
 * sedan loggar in med e-postlänk eller Apple länkas hen till samma konto (vi vill inte ha
 * dubbletter) — och utan det här hade angriparens lösenord fortsatt fungera.
 *
 * Regeln: ett lösenord som sattes innan adressen var bevisad räknas inte. Det nollställs
 * samtidigt som adressen markeras verifierad. Är adressen redan verifierad rörs ingenting —
 * då satte ägaren lösenordet själv.
 *
 * Kostnad: den som registrerade sig med lösenord och senare loggar in med Apple eller
 * e-postlänk för FÖRSTA gången får välja ett nytt lösenord i profilen. Det händer en gång.
 */
export function ownershipUpdate(user: { emailVerified: Date | null; password: string | null }) {
  if (user.emailVerified) return null
  return { emailVerified: new Date(), password: null }
}

export async function markEmailProven(email: string | null | undefined): Promise<void> {
  const address = email?.toLowerCase().trim()
  if (!address) return
  const user = await prisma.user.findUnique({
    where: { email: address },
    select: { id: true, emailVerified: true, password: true },
  })
  if (!user) return
  const data = ownershipUpdate(user)
  if (!data) return
  // Villkoret på emailVerified gör uppdateringen idempotent om två inloggningar krockar.
  await prisma.user.updateMany({ where: { id: user.id, emailVerified: null }, data })
  if (user.password) {
    console.warn(`[auth] lösenord satt före verifiering nollställt för användare ${user.id}`)
  }
}
