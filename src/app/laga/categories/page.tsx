import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AppShell } from '@/components/laga/AppShell'
import { Icon } from '@/components/laga/ui'
import { CategoryManager } from '@/components/CategoryManager'

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/laga/profile"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}
        >
          <Icon name="back" size={18} /> Tillbaka
        </Link>
        <h1 className="mb-1 text-xl font-semibold text-brand-header">Kategorier</h1>
        <p className="mb-4 text-sm text-brand-muted">
          Kategorierna gäller hela gemenskapen — alla medlemmar delar samma uppsättning.
        </p>
        <CategoryManager />
      </div>
    </AppShell>
  )
}
