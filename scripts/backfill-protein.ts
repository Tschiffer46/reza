/**
 * Engångs-/återkommande backfill av Entry.protein för recept som saknar det. Körs efter
 * `prisma db push` i deploy-pipelinen.
 *
 * Idempotent: väljer bara rader med protein IS NULL, så en körning som dör halvvägs
 * fortsätter nästa deploy. Recept modellen utelämnar förblir NULL och provas om nästa gång.
 *
 * Avslutar ALLTID med exit 0 och kastar aldrig ur main: ett fel här får inte fälla en
 * deploy som annars gick bra (och utan ANTHROPIC_API_KEY är det ett no-op, inte ett fel).
 * Självbärande — imagen har scripts/ men inte src/ (se backfill-protein-parse.ts).
 */
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { BACKFILL_MODEL, BACKFILL_SYSTEM_PROMPT, firstText, parseBackfillResponse } from './backfill-protein-parse'

const MAX_PER_RUN = 300
const BATCH_SIZE = 20

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('backfill-protein: ANTHROPIC_API_KEY saknas — hoppar över.')
    return
  }
  const prisma = new PrismaClient()
  try {
    const rows = await prisma.entry.findMany({
      where: { type: 'recipe', protein: null },
      select: { id: true, title: true, ingredients: true },
      orderBy: { createdAt: 'desc' },
      take: MAX_PER_RUN,
    })
    if (rows.length === 0) {
      console.log('backfill-protein: inget att göra.')
      return
    }
    const client = new Anthropic()
    let written = 0
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      try {
        const response = await client.messages.create({
          model: BACKFILL_MODEL,
          max_tokens: 1500,
          // Haiku 5.5 tänker som standard och lägger då ett thinking-block FÖRST i svaret. Det
          // var därför första körningen gav "0 av 55": content[0] var aldrig text.
          thinking: { type: 'disabled' },
          system: BACKFILL_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: JSON.stringify(
                batch.map((r) => ({ id: r.id, title: r.title, ingredients: r.ingredients.slice(0, 40) })),
              ),
            },
          ],
        })
        const text = firstText(response.content)
        const result = parseBackfillResponse(text ?? '', batch.map((r) => r.id))
        if (result.size === 0) {
          // Aldrig tyst igen: ett svar vi inte kan tolka ska synas i deploy-loggen.
          console.error(
            `backfill-protein: batch ${i / BATCH_SIZE + 1} gav inget tolkbart (stop_reason=${response.stop_reason}):`,
            (text ?? '(inget textblock)').slice(0, 200),
          )
        }
        for (const [id, protein] of result) {
          // protein: null i where ⇒ skriver aldrig över något som under tiden satts för hand.
          const r = await prisma.entry.updateMany({ where: { id, protein: null }, data: { protein } })
          written += r.count
        }
      } catch (e) {
        console.error(`backfill-protein: batch ${i / BATCH_SIZE + 1} misslyckades:`, e instanceof Error ? e.message : e)
      }
    }
    console.log(`backfill-protein: ${written} av ${rows.length} recept fick protein.`)
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}

main()
  .catch((e) => console.error('backfill-protein: fel (ignoreras):', e instanceof Error ? e.message : e))
  .finally(() => process.exit(0))
