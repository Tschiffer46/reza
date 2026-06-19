import { PublicShell } from '@/components/PublicShell'

/**
 * Gemensamt skal för text-/innehållssidor (om, kontakt, juridiska sidor). Stylar
 * nästlade rubriker, listor och länkar så att sidorna blir läsbara utan typografi-plugin.
 */
export function ContentPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string
  intro?: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-brand-header">{title}</h1>
        {intro ? <p className="mt-3 text-lg text-brand-muted">{intro}</p> : null}
        {updated ? (
          <p className="mt-2 text-sm text-brand-muted">Senast uppdaterad: {updated}</p>
        ) : null}
        <div className="mt-8 space-y-4 text-brand-ink [&_a]:text-brand-accent [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-header [&_li]:leading-relaxed [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </PublicShell>
  )
}
