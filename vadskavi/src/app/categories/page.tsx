import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { Header } from '@/components/Header'
import { NavBar } from '@/components/NavBar'
import { CategoryManager } from '@/components/CategoryManager'
import { Button } from '@/components/ui/button'

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  return (
    <div className="min-h-screen pb-20">
      <Header>
        <Link href="/profile">
          <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
            Tillbaka
          </Button>
        </Link>
      </Header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold text-brand-header">Kategorier</h1>
        <CategoryManager />
      </main>
      <NavBar />
    </div>
  )
}
