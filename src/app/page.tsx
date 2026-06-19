import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, Users, ShoppingBasket } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { RecipeCard } from '@/components/RecipeCard'
import { Button } from '@/components/ui/button'
import { getAllRecipes } from '@/lib/recipes'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'VadSkaVi — familjens receptbok',
  description:
    'En samling recept som någon i din familj faktiskt lagat och gillat. Hitta middagsinspiration du kan lita på, planera veckan och handla ingredienserna.',
  alternates: { canonical: '/' },
}

const STEPS = [
  {
    icon: Users,
    title: 'Familjen lägger in recepten',
    text: 'Mormors köttbullar, pappas raggmunkar – de rätter ni redan älskar samlas på ett ställe.',
  },
  {
    icon: Heart,
    title: 'Du litar på källan',
    text: 'Varje recept kommer från någon du känner och har lagats på riktigt. Ingen anonym betygsdjungel.',
  },
  {
    icon: ShoppingBasket,
    title: 'Planera och handla',
    text: 'Välj veckans middagar och handla ingredienserna med ett klick.',
  },
]

export default function HomePage() {
  const featured = getAllRecipes().slice(0, 6)

  return (
    <PublicShell>
      {/* Hero */}
      <section className="bg-brand-header text-white">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Recept som någon i din familj faktiskt lagat och gillat
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
            {siteConfig.name} är familjens egna receptbok. Samla rätterna ni litar på, hitta
            middagsinspiration utan tvivel och handla ingredienserna direkt.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-white text-brand-header hover:bg-white/90">
                Skapa konto
              </Button>
            </Link>
            <Link href="/recept">
              <Button
                size="lg"
                variant="outline"
                className="border-white/60 text-white hover:bg-white/10"
              >
                Bläddra bland recept
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/60">📱 Appen kommer snart till App Store.</p>
        </div>
      </section>

      {/* Så funkar det */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-brand-header">Så funkar det</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-brand-line bg-brand-surface p-6 text-center"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent-dark">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-brand-header">{title}</h3>
              <p className="mt-2 text-sm text-brand-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Utvalda recept */}
      <section className="mx-auto max-w-5xl px-4 pb-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-brand-header">Recept att börja med</h2>
          <Link href="/recept" className="text-sm font-medium text-brand-accent hover:underline">
            Se alla recept →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      </section>

      {/* Om-teaser */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-brand-header">Byggt kring tillit, inte algoritmer</h2>
        <p className="mt-4 text-brand-muted">
          {siteConfig.name} drivs av {siteConfig.company.legalName} med en enkel idé: de bästa
          recepten är de som någon du känner redan lagat. Vi håller tjänsten lättviktig,
          europeisk och fri från tunga spårningsskript.
        </p>
        <Link href="/om" className="mt-6 inline-block">
          <Button variant="outline">Läs mer om oss</Button>
        </Link>
      </section>
    </PublicShell>
  )
}
