'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { CategoryDTO, EntryDTO } from '@/lib/types'
import { Icon, Tag, CookedBy, AvatarStack } from '@/components/laga/ui'

const TYPES = [
  { value: '', label: 'Alla' },
  { value: 'recipe', label: 'Recept' },
  { value: 'tip', label: 'Tips' },
]
const SORTS = [
  { value: 'createdAt', label: 'Senaste' },
  { value: 'popular', label: 'Populärast' },
  { value: 'timesCooked', label: 'Mest lagad' },
]

function greetingNow() {
  const h = new Date().getHours()
  if (h < 10) return 'God morgon'
  if (h < 14) return 'Dags för lunch'
  if (h < 22) return 'Vad ska vi laga?'
  return 'Sen kvällshunger?'
}

function RecipeCard({ entry }: { entry: EntryDTO }) {
  const img = entry.imageUrls[0]
  return (
    <Link
      href={`/laga/entry/${entry.id}`}
      className="laga-card"
      style={{
        border: '1px solid var(--card-bd)',
        background: 'var(--card)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: 'inherit',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/10', background: 'var(--thumb-empty)' }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/images/${img}`}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chefhat" size={28} stroke={1.4} color="var(--muted)" />
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 9px',
              borderRadius: 7,
              background: 'rgba(255,255,255,.92)',
              color: 'var(--ink)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {entry.category}
          </span>
        </div>
        {entry.type === 'tip' && (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 9px', borderRadius: 7, background: 'var(--accent)', color: '#fff' }}>
              Tips
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: '13px 14px 14px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 17.5, letterSpacing: '-0.01em', color: 'var(--ink)', lineHeight: 1.2 }}>
          {entry.title}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <CookedBy cookedBy={entry.cookedBy || []} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, color: 'var(--muted)', flexShrink: 0 }}>
            {!!entry.heartCount && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                <Icon name="heart" size={14} color="var(--accent)" fill="var(--accent)" stroke={0} />
                {entry.heartCount}
              </span>
            )}
            {!!entry.commentCount && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                <Icon name="chat" size={14} />
                {entry.commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export function Feed({
  initialEntries,
  categories,
  families = [],
  familyName,
}: {
  initialEntries: EntryDTO[]
  categories: CategoryDTO[]
  families?: { id: string; name: string }[]
  familyName: string
}) {
  const [entries, setEntries] = useState(initialEntries)
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [cat, setCat] = useState('')
  const [family, setFamily] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [loading, setLoading] = useState(false)
  const first = useRef(true)
  const greeting = useMemo(greetingNow, [])

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (type) p.set('type', type)
    if (cat) p.set('category', cat)
    if (family) p.set('family', family)
    if (sort) p.set('sort', sort)
    const res = await fetch(`/api/entries?${p.toString()}`)
    const data = await res.json()
    setEntries(data.entries || [])
    setLoading(false)
  }, [q, type, cat, family, sort])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    fetchEntries()
  }, [fetchEntries])

  const chipCats = useMemo(() => {
    const names = categories.filter((c) => !type || c.type === type).map((c) => c.name)
    return ['Alla', ...names]
  }, [categories, type])

  return (
    <div>
      {/* hälsning */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            {familyName}
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 'clamp(26px,4.5vw,38px)', letterSpacing: '-0.025em', color: 'var(--ink)', marginTop: 4, lineHeight: 1.05 }}>
            {greeting}
          </h1>
        </div>
        <Link
          href="/laga/family"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: 'var(--card)',
            border: '1px solid var(--card-bd)',
            borderRadius: 999,
            padding: '8px 16px',
            color: 'var(--muted)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Familjen
        </Link>
      </div>

      {/* sök */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
          <Icon name="search" size={19} />
        </span>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Sök recept & tips…"
          style={{
            width: '100%',
            padding: '13px 16px 13px 44px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--field-bd)',
            background: 'var(--card)',
            fontSize: 15.5,
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
      </div>

      {/* typ + sort */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: 'var(--chip)', borderRadius: 10, padding: 3, gap: 2 }}>
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setType(t.value)
                setCat('')
              }}
              style={{
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                padding: '7px 16px',
                borderRadius: 8,
                background: type === t.value ? 'var(--card)' : 'transparent',
                color: type === t.value ? 'var(--ink)' : 'var(--muted)',
                boxShadow: type === t.value ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
          <Icon name="sort" size={16} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ appearance: 'none', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer', outline: 'none' }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* familjefilter (om fler än en) */}
      {families.length > 1 && (
        <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
          {[{ id: '', name: 'Alla familjer' }, ...families].map((f) => (
            <button
              key={f.id || 'all'}
              onClick={() => setFamily(f.id)}
              style={{
                border: '1px solid ' + (family === f.id ? 'var(--accent)' : 'var(--card-bd)'),
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                padding: '7px 15px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                background: family === f.id ? 'var(--accent-soft)' : 'var(--card)',
                color: family === f.id ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* kategori-chips */}
      <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 22 }}>
        {chipCats.map((c) => {
          const value = c === 'Alla' ? '' : c
          const activeChip = cat === value
          return (
            <button
              key={c}
              onClick={() => setCat(value)}
              style={{
                border: '1px solid ' + (activeChip ? 'var(--accent)' : 'var(--card-bd)'),
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                padding: '7px 15px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                background: activeChip ? 'var(--accent)' : 'var(--card)',
                color: activeChip ? '#fff' : 'var(--ink)',
              }}
            >
              {c}
            </button>
          )
        })}
      </div>

      {/* grid */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Laddar…</p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <Icon name="search" size={34} color="var(--muted)" />
          <p style={{ marginTop: 12, fontSize: 15 }}>Inga träffar. Prova ett annat ord.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {entries.map((e) => (
            <RecipeCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  )
}
