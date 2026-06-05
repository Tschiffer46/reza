import * as React from 'react'

// ---- Ikonset (inline, stroke-baserat) ----
export const ICON_PATHS: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  users:
    'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M9.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.5a3.5 3.5 0 0 0-2.7-3.4M15 4.6a3 3 0 0 1 0 5.8',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.2-3.2',
  heart: 'M12 20s-6.5-4.2-9-8.2A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 9 5.8c-2.5 4-9 8.2-9 8.2Z',
  chat: 'M4 5h16v10H9l-4 4V5Z',
  back: 'M15 5l-7 7 7 7',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4',
  trash: 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  share: 'M16 6l-4-4-4 4M12 2v13M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7',
  check: 'M5 12.5l4.5 4.5L19 7',
  pot: 'M5 13h14l-1.1 6.1a1.6 1.6 0 0 1-1.6 1.3H7.7a1.6 1.6 0 0 1-1.6-1.3L5 13ZM3.5 13h17M9 13c0-3 1-5.2 3-5.2s3 2.2 3 5.2M12 5.5V4',
  sliders: 'M4 8h10M18 8h2M4 16h2M10 16h10M14 6v4M6 14v4',
  sort: 'M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 20l-3-3',
  bookmark: 'M6 4h12v16l-6-4-6 4V4Z',
  chefhat: 'M7 21h10M7 21v-5M17 21v-5M6 16h12a4 4 0 0 0 .5-7.97A5 5 0 0 0 9 5.5 4 4 0 0 0 6 16Z',
  link: 'M9 15l6-6M10.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-1 1M13.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l1-1',
  x: 'M6 6l12 12M18 6 6 18',
  bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0',
}

export function Icon({
  name,
  size = 22,
  stroke = 1.7,
  fill = 'none',
  color = 'currentColor',
  className,
}: {
  name: keyof typeof ICON_PATHS | string
  size?: number
  stroke?: number
  fill?: string
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <path d={ICON_PATHS[name] || ''} />
    </svg>
  )
}

// ---- Deterministisk avatarfärg från ett frö (namn/e-post/id) ----
const AVATAR_COLORS = [
  '#c75b39',
  '#3f7d63',
  '#4a6fa5',
  '#b07d2a',
  '#8a5a9e',
  '#5a8a6e',
  '#a8492d',
  '#3f6ea5',
]
export function colorFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export interface Person {
  name: string
  seed?: string
}

function initial(name: string) {
  return name === 'Du' ? 'Du' : (name.trim()[0] || '?').toUpperCase()
}

export function Avatar({ name, seed, size = 28 }: Person & { size?: number }) {
  const color = colorFor(seed || name)
  const ini = initial(name)
  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontWeight: 600,
        fontSize: size * (ini.length > 1 ? 0.36 : 0.44),
        letterSpacing: '-0.01em',
      }}
    >
      {ini}
    </div>
  )
}

export function AvatarStack({
  people,
  size = 22,
  max = 4,
}: {
  people: Person[]
  size?: number
  max?: number
}) {
  const shown = people.slice(0, max)
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: max - i }}>
          <div style={{ border: '2px solid var(--card)', borderRadius: '50%' }}>
            <Avatar {...p} size={size} />
          </div>
        </div>
      ))}
      {people.length > max && (
        <div
          style={{
            marginLeft: -size * 0.32,
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'var(--chip)',
            color: 'var(--muted)',
            border: '2px solid var(--card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            fontWeight: 600,
          }}
        >
          +{people.length - max}
        </div>
      )}
    </div>
  )
}

export function Tag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'accent'
}) {
  const tones = {
    neutral: { bg: 'var(--chip)', fg: 'var(--chip-fg)' },
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  }
  const t = tones[tone]
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 7,
        background: t.bg,
        color: t.fg,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </span>
  )
}

export interface CookedEntry {
  name: string
  n: number
}

/** Inline-sammanfattning "Mormor 3× +1" med avatarstack. */
export function CookedBy({ cookedBy, size = 18 }: { cookedBy: CookedEntry[]; size?: number }) {
  if (!cookedBy || cookedBy.length === 0) {
    return <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Ännu inte lagad</span>
  }
  const lead = cookedBy[0]
  const extra = cookedBy.length - 1
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted)' }}>
      <AvatarStack people={cookedBy.map((c) => ({ name: c.name }))} size={size} max={3} />
      <span>
        <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{lead.name}</b>
        {lead.n > 1 ? ` ${lead.n}×` : ''}
        {extra > 0 ? ` +${extra}` : ''}
      </span>
    </span>
  )
}

// ---- Logotyp (gryt-glyf + ordmärke) ----
export function Logo({ size = 'md', onLight = false }: { size?: 'sm' | 'md' | 'lg'; onLight?: boolean }) {
  const dims = { sm: 30, md: 36, lg: 44 }[size]
  const fs = { sm: 19, md: 23, lg: 30 }[size]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: dims * 0.34 }}>
      <div
        style={{
          width: dims,
          height: dims,
          borderRadius: dims * 0.28,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px -2px var(--accent-shadow)',
        }}
      >
        <Icon name="pot" size={dims * 0.62} stroke={1.7} color="#fff" />
      </div>
      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: fs,
            letterSpacing: '-0.02em',
            color: onLight ? '#fff' : 'var(--ink)',
          }}
        >
          Laga
        </div>
        <div
          style={{
            fontSize: dims * 0.22,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: onLight ? 'rgba(255,255,255,.6)' : 'var(--muted)',
            marginTop: 2,
          }}
        >
          vadskavi.nu
        </div>
      </div>
    </div>
  )
}
