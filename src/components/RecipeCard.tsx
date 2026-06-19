import Link from 'next/link'
import { RecipeImage } from '@/components/RecipeImage'
import { formatTime, type PublicRecipe } from '@/lib/recipes'

export function RecipeCard({ recipe }: { recipe: PublicRecipe }) {
  return (
    <Link
      href={`/recept/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-brand-line bg-brand-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        <RecipeImage recipe={recipe} className="transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          {recipe.category}
        </span>
        <h3 className="mt-1 font-semibold text-brand-header">{recipe.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-brand-muted">{recipe.intro}</p>
        <span className="mt-3 text-xs text-brand-muted">
          {formatTime(recipe.timeMinutes)} · {recipe.servings} port.
        </span>
      </div>
    </Link>
  )
}
