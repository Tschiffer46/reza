import type { Metadata } from 'next'
import { PublicShell } from '@/components/PublicShell'
import { RecipeCard } from '@/components/RecipeCard'
import { getAllRecipes } from '@/lib/recipes'

export const metadata: Metadata = {
  title: 'Recept — VadSkaVi',
  description:
    'Bläddra bland klassiska svenska husmansrecept – köttbullar, ärtsoppa, kanelbullar och fler familjefavoriter med tydliga ingredienslistor och steg-för-steg.',
  alternates: { canonical: '/recept' },
}

export default function ReceptIndexPage() {
  const recipes = getAllRecipes()

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold text-brand-header">Recept</h1>
          <p className="mt-3 text-brand-muted">
            Svenska husmansklassiker som familjer lagat i generationer. Varje recept har
            tydliga ingredienser, steg-för-steg och en knapp för att handla hem allt du behöver.
          </p>
        </header>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      </div>
    </PublicShell>
  )
}
