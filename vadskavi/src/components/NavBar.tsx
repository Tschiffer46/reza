'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Hem', icon: Home },
  { href: '/entry/new', label: 'Lägg till', icon: Plus },
]

export function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-brand-accent/20 bg-white safe-area-bottom">
      <div className="mx-auto flex max-w-2xl">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                active ? 'text-brand-accent-dark' : 'text-brand-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
