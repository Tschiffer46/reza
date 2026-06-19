'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo, Icon, Avatar, AvatarStack, type Person } from '@/components/laga/ui'
import { applyBackground } from '@/lib/backgrounds'

const NAV = [
  { href: '/laga', key: 'home', icon: 'home', label: 'Hem' },
  { href: '/laga/family', key: 'family', icon: 'users', label: 'Gemenskapen' },
  { href: '/laga/entry/new', key: 'add', icon: 'plus', label: 'Lägg till' },
  { href: '/laga/snack', key: 'snack', icon: 'chat', label: 'Snack' },
  { href: '/laga/profile', key: 'account', icon: 'user', label: 'Konto' },
] as const

function activeKey(pathname: string): string {
  if (pathname.startsWith('/laga/family')) return 'family'
  if (pathname.startsWith('/laga/entry/new') || pathname.startsWith('/laga/import')) return 'add'
  if (pathname.startsWith('/laga/snack')) return 'snack'
  if (pathname.startsWith('/laga/profile')) return 'account'
  return 'home'
}

/** Ikon med liten accent-prick (för olästa @-omnämnanden på Snack). */
function NavIcon({ icon, size, stroke, dot }: { icon: string; size: number; stroke: number; dot: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <Icon name={icon} size={size} stroke={stroke} />
      {dot && (
        <span style={{ position: 'absolute', top: -1, right: -2, width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--card)' }} />
      )}
    </span>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const active = activeKey(pathname)
  const [family, setFamily] = useState<{ name: string; members: Person[] } | null>(null)
  const [me, setMe] = useState<{ name: string; avatar: string | null } | null>(null)
  const [snackUnread, setSnackUnread] = useState(0)

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
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d && (d.name || d.email)) {
          setMe({ name: d.name || (d.email ? String(d.email).split('@')[0] : 'Du'), avatar: d.avatar || null })
        }
      })
      .catch(() => {})
  }, [])

  // Olästa @-omnämnanden för menypricken — uppdateras vid varje navigering,
  // nollställs när man är inne på Snack.
  useEffect(() => {
    if (pathname.startsWith('/laga/snack')) {
      setSnackUnread(0)
      return
    }
    fetch('/api/snack/unread')
      .then((r) => r.json())
      .then((d) => setSnackUnread(d.count || 0))
      .catch(() => {})
  }, [pathname])

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
              <NavIcon icon={n.icon} size={21} stroke={active === n.key ? 2 : 1.7} dot={n.key === 'snack' && snackUnread > 0} />
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
                {family?.name ?? 'Min gemenskap'}
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
        <Link href="/laga/profile" style={{ display: 'flex' }} aria-label="Mitt konto">
          {me ? (
            <Avatar name={me.name} image={me.avatar || undefined} size={30} />
          ) : (
            memberPeople.length > 0 && <AvatarStack people={memberPeople} size={28} max={3} />
          )}
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
            <NavIcon icon={n.icon} size={23} stroke={active === n.key ? 2 : 1.7} dot={n.key === 'snack' && snackUnread > 0} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
