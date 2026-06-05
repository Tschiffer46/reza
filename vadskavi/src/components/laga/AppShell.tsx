'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo, Icon, AvatarStack, type Person } from '@/components/laga/ui'
import { applyBackground } from '@/lib/backgrounds'

const NAV = [
  { href: '/laga', key: 'home', icon: 'home', label: 'Hem' },
  { href: '/laga/family', key: 'family', icon: 'users', label: 'Familjen' },
  { href: '/laga/entry/new', key: 'add', icon: 'plus', label: 'Lägg till' },
] as const

function activeKey(pathname: string): string {
  if (pathname.startsWith('/laga/family')) return 'family'
  if (pathname.startsWith('/laga/entry/new') || pathname.startsWith('/laga/import')) return 'add'
  return 'home'
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const active = activeKey(pathname)
  const [family, setFamily] = useState<{ name: string; members: Person[] } | null>(null)

  useEffect(() => {
    fetch('/api/family')
      .then((r) => r.json())
      .then((d) => {
        if (d.active) {
          setFamily({
            name: d.active.name,
            members: (d.active.members || []).map((m: { name: string | null; email: string | null }) => ({
              name: m.name || (m.email ? m.email.split('@')[0] : 'Någon'),
            })),
          })
          applyBackground(d.active.background)
        }
      })
      .catch(() => {})
  }, [])

  const memberPeople = family?.members ?? []

  return (
    <div>
      {/* Desktop-sidofält */}
      <aside className="laga-sidebar">
        <div style={{ padding: '4px 6px 22px' }}>
          <Link href="/laga">
            <Logo size="md" />
          </Link>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} className={'nav-item' + (active === n.key ? ' active' : '')}>
              <Icon name={n.icon} size={21} stroke={active === n.key ? 2 : 1.7} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <Link
            href="/laga/family"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              background: 'var(--bg)',
              border: '1px solid var(--card-bd)',
              borderRadius: 13,
              padding: '11px 12px',
            }}
          >
            {memberPeople.length > 0 && <AvatarStack people={memberPeople} size={28} max={4} />}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {family?.name ?? 'Min familj'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{memberPeople.length} medlemmar</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobil toppbar */}
      <header className="laga-topbar">
        <Link href="/laga">
          <Logo size="sm" />
        </Link>
        <Link href="/laga/family" style={{ display: 'flex' }}>
          {memberPeople.length > 0 && <AvatarStack people={memberPeople} size={28} max={3} />}
        </Link>
      </header>

      {/* Innehåll */}
      <main className="laga-main">
        <div className="laga-inner">
          <div className="screen-pad">{children}</div>
        </div>
      </main>

      {/* Mobil bottennav */}
      <nav className="laga-bottomnav">
        {NAV.map((n) => (
          <Link key={n.key} href={n.href} className={'bn-item' + (active === n.key ? ' active' : '')}>
            <Icon name={n.icon} size={23} stroke={active === n.key ? 2 : 1.7} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
