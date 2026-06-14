import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getUserFamilies, getDefaultFamily, userFamilyIds } from '@/lib/family'
import { searchEntries } from '@/lib/search'
import { toEntryDTO } from '@/lib/laga'
import { AppShell } from '@/components/laga/AppShell'
import { Feed } from '@/components/laga/Feed'
import type { CategoryDTO } from '@/lib/types'

export default async function LagaHomePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const userId = session.user.id
  const families = await getUserFamilies(userId)
  const familyIds = await userFamilyIds(userId)
  const defaultId = await getDefaultFamily(userId)
  const familyName = families.find((f) => f.id === defaultId)?.name || 'Receptboken'

  const [rows, rawCategories] = await Promise.all([
    searchEntries({ familyIds, family: defaultId }),
    prisma.category.findMany({ where: { familyId: { in: familyIds } }, orderBy: { name: 'asc' } }),
  ])

  const entries = rows.map(toEntryDTO)

  const seen = new Set<string>()
  const categories: CategoryDTO[] = rawCategories
    .filter((c) => {
      const key = `${c.type}:${c.name.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((c) => ({ id: c.id, name: c.name, type: c.type }))

  return (
    <AppShell>
      <Feed
        initialEntries={entries}
        categories={categories}
        families={families.map((f) => ({ id: f.id, name: f.name }))}
        familyName={familyName}
        activeFamilyId={defaultId}
      />
    </AppShell>
  )
}
