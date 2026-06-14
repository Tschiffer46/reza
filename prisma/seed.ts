import { PrismaClient } from '@prisma/client'
import { DEFAULT_CATEGORIES } from '../src/lib/categories'

const prisma = new PrismaClient()

// Fast id så seeden blir idempotent (kan köras om utan dubletter).
const DEMO_FAMILY_ID = 'seed-demo-family'

async function main() {
  // Skapa/uppdatera en mall-familj så att standardkategorierna kan kopplas.
  const family = await prisma.family.upsert({
    where: { id: DEMO_FAMILY_ID },
    update: {},
    create: {
      id: DEMO_FAMILY_ID,
      name: 'VadSkaVi Demo',
      inviteCode: 'DEMO-VADSKAVI',
      createdById: 'seed',
    },
  })

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { familyId: family.id, name: cat.name, type: cat.type },
    })
    if (!existing) {
      await prisma.category.create({
        data: { name: cat.name, type: cat.type, familyId: family.id },
      })
    }
  }

  const count = await prisma.category.count({ where: { familyId: family.id } })
  console.log(`Seed klar: familj "${family.name}" med ${count} kategorier.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
