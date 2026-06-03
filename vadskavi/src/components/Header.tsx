import Link from 'next/link'

/** Mörkgrön topp-header (#1C3A2B) i Georgia, portad från Rezas header-mönster. */
export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="bg-brand-header text-white px-4 py-4 shadow-md">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          VadSkaVi
        </Link>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  )
}
