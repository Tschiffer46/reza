'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/laga/ui'

export function ProfileForm({
  initialName,
  initialBio,
  initialAvatar,
}: {
  initialName: string
  initialBio: string
  initialAvatar: string | null
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [avatar, setAvatar] = useState<string | null>(initialAvatar)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadPhoto(file: File) {
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('files', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const d = await res.json()
      setAvatar(d.filenames?.[0] ?? avatar)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Kunde inte ladda upp bilden')
    }
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    setError('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, avatar }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 1500)
    } else {
      setError('Kunde inte spara')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar name={name || 'Du'} image={avatar || undefined} size={64} />
        <div className="space-y-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadPhoto(f)
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Laddar upp…' : 'Byt profilbild'}
          </Button>
          {avatar && (
            <button
              type="button"
              onClick={() => setAvatar(null)}
              className="block text-sm text-brand-muted underline"
            >
              Ta bort bild
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-brand-header">Visningsnamn</label>
        <input
          className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ditt namn"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-brand-header">Om mig</label>
        <textarea
          className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Några ord om dig (valfritt)"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={save} disabled={saving}>
        {saving ? 'Sparar…' : saved ? 'Sparat ✓' : 'Spara'}
      </Button>
    </div>
  )
}
