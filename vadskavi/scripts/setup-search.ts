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
