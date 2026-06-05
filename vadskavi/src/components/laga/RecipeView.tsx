'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon, Tag, Avatar, AvatarStack } from '@/components/laga/ui'

export interface RecipeDTO {
  id: string
  type: string
  title: string
  category: string
  blurb: string | null
  time: string | null
  servings: number | null
  ingredients: string[]
  steps: string[]
  drinks: string | null
  source: string | null
  url: string | null
  imageUrls: string[]
  family?: { id: string; name: string }
  cookedBy: { name: string; n: number }[]
  hearted: boolean
  heartCount: number
  notes: { id: string; text: string; author: string; date: string }[]
  comments: { id: string; text: string; author: string; date: string }[]
}

function scaleIngredient(str: string, scale: number) {
  if (scale === 1) return str
  return str.replace(/^(\d+[.,]?\d*)/, (m) => {
    const v = parseFloat(m.replace(',', '.')) * scale
    const r = Math.round(v * 10) / 10
    return (Number.isInteger(r) ? r : r.toFixed(1).replace('.', ',')).toString()
  })
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 0 14px' }}>
      {icon && <Icon name={icon} size={19} color="var(--accent)" />}
      <h2 style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{children}</h2>
    </div>
  )
}

export function RecipeView({ recipe, meName }: { recipe: RecipeDTO; meName: string }) {
  const router = useRouter()
  const [cookedBy, setCookedBy] = useState(recipe.cookedBy)
  const [justCooked, setJustCooked] = useState(false)
  const [hearted, setHearted] = useState(recipe.hearted)
  const [heartCount, setHeartCount] = useState(recipe.heartCount)
  const [notes, setNotes] = useState(recipe.notes)
  const [comments, setComments] = useState(recipe.comments)
  const [noteText, setNoteText] = useState('')
  const [commentText, setCommentText] = useState('')
  const [servings, setServings] = useState(recipe.servings || 0)

  const totalCooked = cookedBy.reduce((s, c) => s + c.n, 0)
  const scale = recipe.servings && servings ? servings / recipe.servings : 1
  const img = recipe.imageUrls[0]

  async function markCooked() {
    setCookedBy((prev) => {
      const mine = prev.find((c) => c.name === meName)
      if (mine) return prev.map((c) => (c.name === meName ? { ...c, n: c.n + 1 } : c))
      return [{ name: meName, n: 1 }, ...prev]
    })
    setJustCooked(true)
    setTimeout(() => setJustCooked(false), 2200)
    await fetch(`/api/entries/${recipe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cooked' }),
    })
    router.refresh()
  }

  async function toggleHeart() {
    const res = await fetch(`/api/entries/${recipe.id}/reactions`, { method: 'POST' })
    if (res.ok) {
      const d = await res.json()
      setHearted(d.hearted)
      setHeartCount(d.count)
    }
  }

  async function addNote() {
    if (!noteText.trim()) return
    const text = noteText.trim()
    setNoteText('')
    const res = await fetch(`/api/entries/${recipe.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) setNotes((p) => [...p, { id: crypto.randomUUID(), text, author: meName, date: 'just nu' }])
  }

  async function addComment() {
    if (!commentText.trim()) return
    const text = commentText.trim()
    setCommentText('')
    const res = await fetch(`/api/entries/${recipe.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) setComments((p) => [...p, { id: crypto.randomUUID(), text, author: meName, date: 'just nu' }])
  }

  const fieldStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 13px',
    borderRadius: 10,
    border: '1px solid var(--field-bd)',
    background: 'var(--card)',
    fontSize: 14,
    color: 'var(--ink)',
    outline: 'none',
  }

  return (
    <div className="recipe-detail">
      {/* hero */}
      <div style={{ position: 'relative' }}>
        <div className="recipe-hero" style={{ background: img ? undefined : 'var(--accent-soft)' }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/images/${img}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chefhat" size={40} color="var(--accent)" stroke={1.3} />
            </div>
          )}
        </div>
        <Link href="/laga" className="hero-back" aria-label="Tillbaka">
          <Icon name="back" size={20} color="var(--ink)" />
        </Link>
      </div>

      <div className="recipe-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Tag tone="accent">{recipe.category}</Tag>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{recipe.type === 'tip' ? 'Tips' : 'Recept'}</span>
          {recipe.time && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--muted)' }}>
              <Icon name="clock" size={14} />
              {recipe.time}
            </span>
          )}
          {recipe.family && (
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>· {recipe.family.name}</span>
          )}
        </div>

        <h1 style={{ fontWeight: 700, fontSize: 'clamp(28px,5vw,40px)', letterSpacing: '-0.025em', color: 'var(--ink)', lineHeight: 1.05 }}>
          {recipe.title}
        </h1>
        {recipe.blurb && <p style={{ fontSize: 16, color: 'var(--muted)', marginTop: 10, maxWidth: '52ch', lineHeight: 1.5 }}>{recipe.blurb}</p>}

        {/* actions */}
        <div className="recipe-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
            <button
              onClick={markCooked}
              className="btn-cooked"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: justCooked ? 'var(--sage)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: 15.5,
                fontWeight: 600,
                transition: 'background .2s, transform .1s',
              }}
            >
              <Icon name={justCooked ? 'check' : 'pot'} size={19} color="#fff" />
              {justCooked ? 'Lagad! 🎉' : 'Jag lagade den'}
            </button>
            <button
              onClick={toggleHeart}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'var(--card)',
                border: '1px solid var(--card-bd)',
                color: hearted ? 'var(--accent)' : 'var(--ink)',
                borderRadius: 12,
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <Icon name="heart" size={18} color="var(--accent)" fill={hearted ? 'var(--accent)' : 'none'} stroke={hearted ? 0 : 1.7} />
              {heartCount}
            </button>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 9 }}>
            {totalCooked > 0 ? (
              <>
                <AvatarStack people={cookedBy.map((c) => ({ name: c.name }))} size={26} max={5} />
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                  Lagad <b style={{ color: 'var(--ink)' }}>{totalCooked}×</b> i familjen — {cookedBy.map((c) => c.name + (c.n > 1 ? ' ' + c.n + '×' : '')).join(', ')}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Bli först i familjen att laga den.</span>
            )}
          </div>
        </div>

        <div className="recipe-cols">
          {/* vänster: ingredienser + steg */}
          <div style={{ minWidth: 0 }}>
            {recipe.ingredients.length > 0 && (
              <section style={{ marginBottom: 34 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
                  <SectionTitle icon="bookmark">Ingredienser</SectionTitle>
                  {recipe.servings ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1px solid var(--card-bd)', borderRadius: 10, padding: '5px 8px' }}>
                      <button onClick={() => setServings((s) => Math.max(1, s - 1))} className="step-btn">−</button>
                      <span style={{ fontSize: 14, fontWeight: 600, minWidth: 64, textAlign: 'center', color: 'var(--ink)' }}>{servings} port.</span>
                      <button onClick={() => setServings((s) => s + 1)} className="step-btn">+</button>
                    </div>
                  ) : null}
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid var(--card-bd)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', marginTop: 8, flexShrink: 0 }} />
                      <span style={{ fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.45 }}>{scaleIngredient(ing, scale)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {recipe.steps.length > 0 && (
              <section style={{ marginBottom: 10 }}>
                <SectionTitle icon="chefhat">{recipe.type === 'tip' ? 'Så gör du' : 'Gör så här'}</SectionTitle>
                <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {recipe.steps.map((s, i) => (
                    <li key={i} style={{ display: 'flex', gap: 14 }}>
                      <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14.5 }}>{i + 1}</span>
                      <span style={{ fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.55, paddingTop: 3 }}>{s}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {recipe.drinks && (
              <section style={{ marginTop: 24 }}>
                <SectionTitle>Dryck</SectionTitle>
                <p style={{ fontSize: 15.5, color: 'var(--ink)' }}>{recipe.drinks}</p>
              </section>
            )}
            {(recipe.source || recipe.url) && (
              <p style={{ marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
                {recipe.source && <>Källa: {recipe.source} </>}
                {recipe.url && (
                  <a href={recipe.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                    länk
                  </a>
                )}
              </p>
            )}
          </div>

          {/* höger: noteringar + kommentarer */}
          <div className="recipe-social" style={{ minWidth: 0 }}>
            <section style={{ marginBottom: 30 }}>
              <SectionTitle icon="edit">Familjens noteringar</SectionTitle>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -8, marginBottom: 14 }}>Små tweaks som stannar i familjen.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {notes.length === 0 && <div style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Inga noteringar än — dela ditt knep!</div>}
                {notes.map((n) => (
                  <div key={n.id} style={{ display: 'flex', gap: 11, padding: '13px 14px', background: 'var(--accent-soft)', borderRadius: 13 }}>
                    <Avatar name={n.author} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <b style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{n.author}</b>
                        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{n.date}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.45 }}>{n.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder="Lägg till en notering…" style={fieldStyle} />
                <button onClick={addNote} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Spara</button>
              </div>
            </section>

            <section>
              <SectionTitle icon="chat">Kommentarer</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {comments.length === 0 && <div style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Bli först att kommentera.</div>}
                {comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: 11 }}>
                    <Avatar name={c.author} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <b style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{c.author}</b>
                        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.date}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.45, marginTop: 2 }}>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Avatar name={meName} size={30} />
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder="Skriv en kommentar…" style={fieldStyle} />
                <button onClick={addComment} style={{ background: 'var(--card)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Skicka</button>
              </div>
            </section>

            <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--card-bd)' }}>
              <Link href={`/laga/entry/${recipe.id}/edit`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                <Icon name="edit" size={15} /> Redigera receptet
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
