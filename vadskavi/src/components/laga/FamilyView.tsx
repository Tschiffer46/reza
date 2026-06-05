'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon, Avatar, AvatarStack } from '@/components/laga/ui'
import { BACKGROUND_NAMES, BACKGROUNDS, applyBackground } from '@/lib/backgrounds'

export interface FamilyViewData {
  id: string
  name: string
  inviteCode: string
  background: string | null
  coverImage: string | null
  stats: { recipes: number; cooked: number; cooks: number }
  members: { name: string; role: string; added: number; cooked: number }[]
  activity: { actor: string; verb: string; entryId: string; title: string; img: string | null; when: string }[]
  families: { id: string; name: string }[]
}

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--card-bd)',
  borderRadius: 'var(--radius)',
  padding: '20px 22px',
  marginBottom: 22,
}
const field: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '10px 13px',
  borderRadius: 10,
  border: '1px solid var(--field-bd)',
  background: 'var(--card)',
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
}
const h2: React.CSSProperties = { fontWeight: 700, fontSize: 17, color: 'var(--ink)' }

export function FamilyView({ data }: { data: FamilyViewData }) {
  const router = useRouter()
  const [name, setName] = useState(data.name)
  const [bg, setBg] = useState(data.background || 'Linne')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [newName, setNewName] = useState('')
  const coverInput = useRef<HTMLInputElement>(null)

  async function patch(body: object) {
    setBusy(true)
    await fetch(`/api/family/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(false)
    router.refresh()
  }

  async function chooseBg(n: string) {
    setBg(n)
    applyBackground(n)
    await fetch(`/api/family/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ background: n }) })
  }

  async function uploadCover(files: FileList | null) {
    if (!files || !files[0]) return
    const fd = new FormData()
    fd.append('file', files[0])
    setBusy(true)
    await fetch(`/api/family/${data.id}/cover`, { method: 'POST', body: fd })
    setBusy(false)
    router.refresh()
  }

  async function call(url: string, body: object) {
    setBusy(true)
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(false)
    router.refresh()
  }

  return (
    <div>
      <Link href="/laga" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14, fontWeight: 600, marginBottom: 18 }}>
        <Icon name="back" size={18} /> Tillbaka
      </Link>

      {/* header card */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div
          onClick={() => coverInput.current?.click()}
          style={{
            height: 150,
            cursor: 'pointer',
            position: 'relative',
            background: data.coverImage ? undefined : 'linear-gradient(135deg,var(--accent-soft),var(--thumb-empty))',
          }}
        >
          {data.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/images/${data.coverImage}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <span style={{ position: 'absolute', bottom: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 11px', borderRadius: 999 }}>
            <Icon name="edit" size={13} color="#fff" /> {data.coverImage ? 'Byt omslag' : 'Lägg till omslag'}
          </span>
          <input ref={coverInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => uploadCover(e.target.files)} />
        </div>
        <div style={{ padding: '22px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Receptbok</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ fontWeight: 700, fontSize: 'clamp(24px,4vw,32px)', letterSpacing: '-0.025em', color: 'var(--ink)', border: 'none', background: 'transparent', outline: 'none', borderBottom: '1px dashed transparent', minWidth: 0 }}
                  onFocus={(e) => (e.target.style.borderBottomColor = 'var(--card-bd)')}
                  onBlur={(e) => (e.target.style.borderBottomColor = 'transparent')}
                />
                {name.trim() && name !== data.name && (
                  <button onClick={() => patch({ name })} disabled={busy} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Spara
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
                <Stat n={data.stats.recipes} label="recept" />
                <Stat n={data.stats.cooked} label="tillagningar" />
                <Stat n={data.stats.cooks} label="kockar" />
              </div>
            </div>
            <AvatarStack people={data.members.map((m) => ({ name: m.name }))} size={44} max={5} />
          </div>
        </div>
      </div>

      {/* invite */}
      <div style={{ ...card, background: 'var(--accent-soft)', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Icon name="users" size={20} color="var(--accent)" />
          <h2 style={h2}>Bjud in fler</h2>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.8, marginBottom: 14, maxWidth: '46ch' }}>
          Dela koden så kan mormor, kusiner och bonusfamiljen lägga till sina egna recept i samma bok (Konto → Familj → Gå med).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--card)', border: '1px solid var(--card-bd)', borderRadius: 10, padding: '11px 14px' }}>
            <Icon name="link" size={16} color="var(--muted)" />
            <span style={{ fontSize: 14, fontFamily: 'monospace', color: 'var(--ink)' }}>{data.inviteCode}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(data.inviteCode)
              setCopied(true)
              setTimeout(() => setCopied(false), 1800)
            }}
            style={{ background: copied ? 'var(--sage)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', cursor: 'pointer', fontSize: 14.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <Icon name={copied ? 'check' : 'link'} size={16} color="#fff" />
            {copied ? 'Kopierad!' : 'Kopiera kod'}
          </button>
        </div>
      </div>

      {/* background chooser */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Icon name="sliders" size={20} color="var(--accent)" />
          <h2 style={h2}>Familjens bakgrund</h2>
        </div>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14, maxWidth: '46ch' }}>Välj en känsla för er bok — alla i familjen ser samma.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {BACKGROUND_NAMES.map((n) => {
            const active = bg === n
            return (
              <button
                key={n}
                onClick={() => chooseBg(n)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  cursor: 'pointer',
                  background: active ? 'var(--accent-soft)' : 'var(--bg)',
                  border: '1px solid ' + (active ? 'var(--accent)' : 'var(--card-bd)'),
                  borderRadius: 999,
                  padding: '7px 14px 7px 8px',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                  fontWeight: 600,
                  fontSize: 13.5,
                }}
              >
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: BACKGROUNDS[n][0], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
                {n}
              </button>
            )
          })}
        </div>
      </div>

      <div className="family-cols">
        {/* members */}
        <section>
          <h2 style={{ fontWeight: 700, fontSize: 19, color: 'var(--ink)', marginBottom: 8 }}>Medlemmar</h2>
          {data.members.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 0', borderBottom: '1px solid var(--card-bd)' }}>
              <Avatar name={m.name} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</b>
                  {m.role === 'admin' && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 7px', borderRadius: 6 }}>Ägare</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{m.added} recept · lagat {m.cooked}×</div>
              </div>
            </div>
          ))}
        </section>

        {/* activity */}
        <section>
          <h2 style={{ fontWeight: 700, fontSize: 19, color: 'var(--ink)', marginBottom: 8 }}>Senaste i köket</h2>
          {data.activity.length === 0 && <p style={{ fontSize: 14, color: 'var(--muted)' }}>Inget händer än — lägg till ett recept!</p>}
          {data.activity.map((a, i) => (
            <Link key={i} href={`/laga/entry/${a.entryId}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px', borderBottom: '1px solid var(--card-bd)' }}>
              <Avatar name={a.actor} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.4 }}>
                  <b style={{ fontWeight: 600 }}>{a.actor}</b>
                  <span style={{ color: 'var(--muted)' }}> {a.verb} </span>
                  <b style={{ fontWeight: 600 }}>{a.title}</b>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{a.when}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: 'var(--thumb-empty)', flexShrink: 0, overflow: 'hidden' }}>
                {a.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/images/${a.img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            </Link>
          ))}
        </section>
      </div>

      {/* family switcher */}
      <div style={{ ...card, marginTop: 28 }}>
        <h2 style={{ ...h2, marginBottom: 12 }}>Dina familjer</h2>
        {data.families.map((f) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{f.name}</span>
            {f.id === data.id ? (
              <span style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>Standard</span>
            ) : (
              <button onClick={() => call('/api/family/switch', { familyId: f.id })} disabled={busy} style={{ background: 'var(--card)', border: '1px solid var(--card-bd)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                Sätt som standard
              </button>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Inbjudningskod" style={field} />
          <button onClick={() => joinCode.trim() && call('/api/family/join', { inviteCode: joinCode }).then(() => setJoinCode(''))} disabled={busy || !joinCode.trim()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            Gå med
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Skapa ny familj…" style={field} />
          <button onClick={() => newName.trim() && call('/api/family', { name: newName }).then(() => setNewName(''))} disabled={busy || !newName.trim()} style={{ background: 'var(--card)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            Skapa
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{n}</span>{' '}
      <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}
