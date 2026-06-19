import { cn } from '@/lib/utils'
import type { PublicRecipe } from '@/lib/recipes'

/**
 * Receptbild. Visar ett riktigt foto om `recipe.image` är satt (drop-in `.webp` i
 * `public/img/recept/`), annars ett varumärkt receptkort med rättens namn — så att
 * det aldrig blir en trasig bild innan riktiga foton lagts till.
 */
export function RecipeImage({
  recipe,
  className,
  priority = false,
}: {
  recipe: Pick<PublicRecipe, 'title' | 'category' | 'image'>
  className?: string
  priority?: boolean
}) {
  if (recipe.image) {
    return (
      // next/image är avstängt (unoptimized) i projektet → vanlig img räcker.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/img/recept/${recipe.image}`}
        alt={recipe.title}
        className={cn('h-full w-full object-cover', className)}
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-accent to-sage p-6 text-center',
        className,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
        {recipe.category}
      </span>
      <span className="font-serif text-2xl font-semibold leading-tight text-white drop-shadow-sm">
        {recipe.title}
      </span>
    </div>
  )
}
