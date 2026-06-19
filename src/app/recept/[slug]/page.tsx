import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShoppingBasket } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { RecipeImage } from '@/components/RecipeImage'
import { getAllRecipes, getRecipeBySlug, formatTime, isoDuration } from '@/lib/recipes'
import { buildShopLink } from '@/lib/affiliate'
import { siteConfig } from '@/lib/site-config'

export function generateStaticParams() {
  return getAllRecipes().map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const recipe = getRecipeBySlug(slug)
  if (!recipe) return { title: 'Recept hittades inte — VadSkaVi' }
  return {
    title: `${recipe.title} — VadSkaVi`,
    description: recipe.intro,
    alternates: { canonical: `/recept/${recipe.slug}` },
  }
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recipe = getRecipeBySlug(slug)
  if (!recipe) notFound()

  const shop = buildShopLink(recipe.title)
  const imageUrl = recipe.image
    ? `${siteConfig.url}/img/recept/${recipe.image}`
    : `${siteConfig.url}/recept/${recipe.slug}/opengraph-image`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.intro,
    image: [imageUrl],
    author: { '@type': 'Organization', name: siteConfig.company.legalName },
    recipeCategory: recipe.category,
    recipeYield: `${recipe.servings} portioner`,
    totalTime: isoDuration(recipe.timeMinutes),
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    })),
  }

  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-4 text-sm text-brand-muted">
          <Link href="/recept" className="hover:text-brand-accent">
            ← Alla recept
          </Link>
        </nav>

        <span className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          {recipe.category}
        </span>
        <h1 className="mt-1 text-3xl font-bold text-brand-header sm:text-4xl">{recipe.title}</h1>
        <p className="mt-3 text-lg text-brand-muted">{recipe.intro}</p>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-ink">
          <span>
            <span className="text-brand-muted">Tid:</span> {formatTime(recipe.timeMinutes)}
          </span>
          <span>
            <span className="text-brand-muted">Portioner:</span> {recipe.servings}
          </span>
        </div>

        <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl">
          <RecipeImage recipe={recipe} priority />
        </div>

        {/* Handla-ingredienserna (affiliate) */}
        <div className="mt-8 rounded-xl border border-brand-line bg-brand-surface p-5">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={shop.href}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-accent-dark"
            >
              <ShoppingBasket className="h-5 w-5" />
              Handla ingredienserna
            </a>
            <span className="rounded-full bg-brand-chip px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Annonslänk
            </span>
          </div>
          <p className="mt-3 text-xs text-brand-muted">
            Länken går till en samarbetspartner. Vi kan få provision om du handlar – det
            påverkar inte ditt pris.{' '}
            <Link href="/om-annonslankar" className="text-brand-accent underline">
              Läs mer
            </Link>
            .
          </p>
        </div>

        <div className="mt-10 grid gap-10 sm:grid-cols-[1fr_1.4fr]">
          <section>
            <h2 className="text-xl font-bold text-brand-header">Ingredienser</h2>
            <ul className="mt-4 space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex gap-2 text-brand-ink">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-header">Gör så här</h2>
            <ol className="mt-4 space-y-4">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-sm font-semibold text-brand-accent-dark">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-brand-ink">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </article>
    </PublicShell>
  )
}
