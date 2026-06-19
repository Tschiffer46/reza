'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Avatar } from '@/components/laga/ui'
import { SNACK_TTL_DAYS } from '@/lib/snack'

export interface SnackReply {
  id: string
  author: string
  avatar: string | null
  text: string
  when: string
  mine: boolean
}
export interface SnackPost {
  id: string
  author: string
  avatar: string | null
  text: string
  when: string
  mine: boolean
  replies: SnackReply[]
}

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--card-bd)',
  borderRadius: 'var(--radius)',
  padding: '16px 18px',
  marginBottom: 14,
}
const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 70,
  padding: '11px 13px',
  borderRadius: 12,
  border: '1px solid var(--field-bd)',
  background: 'var(--card)',
  fontSize: 14.5,
  color: 'var(--ink)',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
}
const primaryBtn: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '9px 18px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
}

export function SnackBoard({ posts, canModerate }: { posts: SnackPost[]; canModerate: boolean }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  async function send(url: string, body: object) {
    setBusy(true)
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(false)
    router.refresh()
  }

  async function post() {
    if (!text.trim()) return
    await send('/api/posts', { text })
    setText('')
  }

  async function reply(postId: string) {
    if (!replyText.trim()) return
    await send(`/api/posts/${postId}/replies`, { text: replyText })
    setReplyText('')
    setReplyFor(null)
  }

  async function del(url: string) {
    if (!confirm('Ta bort?')) return
    setBusy(true)
    await fetch(url, { method: 'DELETE' })
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 4 }}>Snack</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 18 }}>
        Fråga gänget, dela infall, planera helgen. Inlägg försvinner automatiskt efter {SNACK_TTL_DAYS} dagar.
      </p>

      {/* composer */}
      <div style={card}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Vad vill du fråga eller dela? T.ex. ”Sugen på att grilla ikväll — någon med ett bra salladsrecept?”"
          style={textareaStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={post} disabled={busy || !text.trim()} style={{ ...primaryBtn, opacity: busy || !text.trim() ? 0.6 : 1 }}>
            Posta
          </button>
        </div>
      </div>

      {posts.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', padding: '28px 0' }}>
          Inga inlägg än — bli först att skriva något!
        </p>
      )}

      {posts.map((p) => (
        <div key={p.id} style={card}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name={p.author} image={p.avatar || undefined} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <b style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{p.author}</b>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{p.when}</span>
              </div>
              <div style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.5, marginTop: 4, whiteSpace: 'pre-wrap' }}>{p.text}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <button
                  onClick={() => { setReplyFor(replyFor === p.id ? null : p.id); setReplyText('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Icon name="chat" size={15} color="var(--accent)" /> Svara
                </button>
                {(p.mine || canModerate) && (
                  <button onClick={() => del(`/api/posts/${p.id}`)} disabled={busy} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#c0392b' }}>
                    Ta bort
                  </button>
                )}
              </div>

              {/* replies */}
              {p.replies.length > 0 && (
                <div style={{ marginTop: 12, borderLeft: '2px solid var(--card-bd)', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.replies.map((r) => (
                    <div key={r.id} style={{ display: 'flex', gap: 9 }}>
                      <Avatar name={r.author} image={r.avatar || undefined} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <b style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{r.author}</b>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.when}</span>
                          {(r.mine || canModerate) && (
                            <button onClick={() => del(`/api/posts/${p.id}/replies/${r.id}`)} disabled={busy} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#c0392b', marginLeft: 'auto' }}>
                              Ta bort
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.45, marginTop: 2, whiteSpace: 'pre-wrap' }}>{r.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* reply composer */}
              {replyFor === p.id && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Skriv ett svar…"
                    style={{ ...textareaStyle, minHeight: 54 }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <button onClick={() => setReplyFor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--muted)' }}>
                      Avbryt
                    </button>
                    <button onClick={() => reply(p.id)} disabled={busy || !replyText.trim()} style={{ ...primaryBtn, padding: '7px 14px', opacity: busy || !replyText.trim() ? 0.6 : 1 }}>
                      Svara
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
