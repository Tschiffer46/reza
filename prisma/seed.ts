import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  // Recept
  { name: 'Huvudrätt', type: 'recipe' },
  { name: 'Förrätt', type: 'recipe' },
  { name: 'Efterrätt', type: 'recipe' },
  { name: 'Bakning', type: 'recipe' },
  { name: 'Soppa', type: 'recipe' },
  { name: 'Sallad', type: 'recipe' },
  { name: 'Frukost', type: 'recipe' },
  { name: 'Snacks', type: 'recipe' },
  { name: 'Dryck', type: 'recipe' },
  // Tips
  { name: 'Matlagning', type: 'tip' },
  { name: 'Förvaring', type: 'tip' },
  { name: 'Kryddor', type: 'tip' },
  { name: 'Redskap', type: 'tip' },
  { name: 'Övrigt', type: 'tip' },
]

async function main() {
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log(`Seeded ${categories.length} categories`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
