import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

/**
 * Tvinga nya konton genom onboarding innan de når appen. En "ny" användare har
 * varken slutfört onboarding eller någon gemenskap — då skickas de till
 * /onboarding (gäller även magic-link/OAuth-nya, inte bara registrering).
 * Befintliga användare (med gemenskaper) påverkas inte.
 */
export default async function LagaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const [user, membershipCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { onboardedAt: true } }),
    prisma.membership.count({ where: { userId: session.user.id } }),
  ])
  if (!user?.onboardedAt && membershipCount === 0) {
    redirect('/onboarding')
  }
  return <>{children}</>
}
