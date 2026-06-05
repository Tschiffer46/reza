'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FamilyData {
  activeId: string
  families: { id: string; name: string; role: string }[]
  active: {
    id: string
    name: string
    inviteCode: string
    members: { name: string | null; email: string | null; role: string }[]
  } | null
}

const inputClass =
  'w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent'

export function FamilyManager() {
  const router = useRouter()
  const [data, setData] = useState<FamilyData | null>(null)
  const [name, setName] = useState('')
  const [newName, setNewName] = useState('')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/family')
    if (res.ok) {
      const d: FamilyData = await res.json()
      setData(d)
      setName(d.active?.name || '')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function call(url: string, body: object, method = 'POST') {
    setBusy(true)
    setError('')
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      setError(e.error || 'Något gick fel')
      return false
    }
    await load()
    router.refresh()
    return true
  }

  if (!data) return <p className="text-brand-muted">Laddar…</p>

  return (
    <div className="space-y-6">
      {/* Standardfamilj */}
      <section className="space-y-3 rounded-xl border border-brand-accent/20 bg-white p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-header">
          <Users className="h-5 w-5" /> Standardfamilj
        </h2>
        <p className="text-sm text-brand-muted">
          Nya recept hamnar här. Du ser och söker recept i alla dina familjer oavsett vald standard.
        </p>

        <div className="flex gap-2">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            disabled={busy || !name.trim() || name === data.active?.name}
            onClick={() => data.active && call(`/api/family/${data.active.id}`, { name }, 'PATCH')}
          >
            Spara
          </Button>
        </div>

        {data.active && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-brand-muted">Inbjudningskod:</span>
            <code className="rounded bg-brand-accent/10 px-2 py-0.5 font-mono text-brand-accent-dark">
              {data.active.inviteCode}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(data.active!.inviteCode)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className="text-brand-accent-dark"
              aria-label="Kopiera kod"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}

        <div>
          <p className="mb-1 text-sm font-medium text-brand-header">Medlemmar</p>
          <ul className="space-y-1 text-sm text-brand-ink">
            {data.active?.members.map((m, i) => (
              <li key={i}>
                {m.name || m.email}
                {m.role === 'admin' && <span className="ml-1 text-xs text-brand-muted">(admin)</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Byt familj */}
      {data.families.length > 1 && (
        <section className="space-y-2 rounded-xl border border-brand-accent/20 bg-white p-4">
          <h2 className="text-lg font-semibold text-brand-header">Mina familjer</h2>
          {data.families.map((f) => (
            <div key={f.id} className="flex items-center justify-between">
              <span className="text-brand-ink">{f.name}</span>
              {f.id === data.activeId ? (
                <span className="text-xs text-brand-accent-dark">Standard</span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => call('/api/family/switch', { familyId: f.id })}
                >
                  Sätt som standard
                </Button>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Gå med */}
      <section className="space-y-2 rounded-xl border border-brand-accent/20 bg-white p-4">
        <h2 className="text-lg font-semibold text-brand-header">Gå med i en familj</h2>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Inbjudningskod"
          />
          <Button
            disabled={busy || !code.trim()}
            onClick={async () => {
              if (await call('/api/family/join', { inviteCode: code })) setCode('')
            }}
          >
            Gå med
          </Button>
        </div>
      </section>

      {/* Skapa ny */}
      <section className="space-y-2 rounded-xl border border-brand-accent/20 bg-white p-4">
        <h2 className="text-lg font-semibold text-brand-header">Skapa ny familj</h2>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Familjenamn"
          />
          <Button
            disabled={busy || !newName.trim()}
            onClick={async () => {
              if (await call('/api/family', { name: newName })) setNewName('')
            }}
          >
            Skapa
          </Button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
