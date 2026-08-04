import type { Principle } from '@/lib/site-copy'

/** En av husets principer. Copy kommer från `src/lib/site-copy.ts`, aldrig härifrån. */
export function PrincipleCard({ principle }: { principle: Principle }) {
  const { icon: Icon, title, text } = principle
  return (
    <div className="rounded-xl border border-brand-line bg-brand-surface p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-site-soft text-site-accent">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-semibold text-brand-header">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">{text}</p>
    </div>
  )
}
