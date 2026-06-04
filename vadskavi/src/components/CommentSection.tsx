'use client'

import { useState } from 'react'
import type { CommentDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'

function authorName(author: { name: string | null; email: string | null }) {
  return author.name || author.email || 'Någon'
}

export function CommentSection({
  entryId,
  initialComments,
}: {
  entryId: string
  initialComments: CommentDTO[]
}) {
  const [comments, setComments] = useState(initialComments)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    const res = await fetch(`/api/entries/${entryId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setText('')
    }
    setSaving(false)
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-brand-header">Kommentarer</h2>

      {comments.length === 0 ? (
        <p className="text-sm text-brand-muted">Inga kommentarer ännu.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-brand-accent/20 bg-white p-3">
              <p className="text-brand-ink">{c.text}</p>
              <p className="mt-1 text-xs text-brand-muted">
                {authorName(c.author)} · {new Date(c.createdAt).toLocaleDateString('sv-SE')}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Skriv en kommentar…"
          className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
        <Button type="submit" size="sm" disabled={saving || !text.trim()}>
          {saving ? 'Skickar…' : 'Kommentera'}
        </Button>
      </form>
    </section>
  )
}
