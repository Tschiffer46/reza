/**
 * Idempotent uppsättning av svensk fulltext-sök för Entry.searchVector.
 * Skapar trigger-funktion, trigger, GIN-index och backfill. Körs efter `prisma db push`.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VECTOR = `
  setweight(to_tsvector('swedish', coalesce(%T%.title, '')), 'A') ||
  setweight(to_tsvector('swedish', coalesce(array_to_string(%T%.ingredients, ' '), '')), 'B') ||
  setweight(to_tsvector('swedish', coalesce(%T%.instructions, '')), 'C') ||
  setweight(to_tsvector('swedish', coalesce(%T%.content, '')), 'C') ||
  setweight(to_tsvector('swedish', coalesce(%T%.blurb, '')), 'C')
`

/**
 * Stavningstolerans (pg_trgm). Får aldrig fälla deploy: CREATE EXTENSION kräver rättigheter
 * (trusted extension sedan PG13, men bara för databasägaren) och kan nekas. Då loggar vi det
 * och går vidare — src/lib/search.ts fångar felet och sökningen beter sig som utan tillägget.
 */
async function setupTrigram() {
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`)
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS entry_title_trgm_idx ON "Entry" USING GIN (lower(title) gin_trgm_ops);`,
    )
    console.log('pg_trgm uppsatt (stavningstolerant sök + trigramindex på rubrik).')
  } catch (e) {
    console.warn(
      `VARNING: pg_trgm kunde inte sättas upp, stavningstolerant sök är AV (ordinarie sök opåverkad): ${
        e instanceof Error ? e.message.replace(/\s+/g, ' ').trim() : e
      }`,
    )
  }
}

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION entry_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW."searchVector" := ${VECTOR.replace(/%T%/g, 'NEW')};
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `)
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS entry_search_vector_trigger ON "Entry";`)
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER entry_search_vector_trigger
    BEFORE INSERT OR UPDATE ON "Entry"
    FOR EACH ROW EXECUTE FUNCTION entry_search_vector_update();
  `)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS entry_search_idx ON "Entry" USING GIN ("searchVector");`)
  await prisma.$executeRawUnsafe(`UPDATE "Entry" SET "searchVector" = ${VECTOR.replace(/%T%/g, '"Entry"')} WHERE "searchVector" IS NULL;`)
  await setupTrigram()
  console.log('Fulltext-sök uppsatt (trigger + GIN-index + backfill).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
