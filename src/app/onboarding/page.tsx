'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo, Icon } from '@/components/laga/ui'
import { Button } from '@/components/ui/button'

const SLIDES = [
  {
    icon: 'pot',
    title: 'Vad ska vi laga?',
    body: 'Den eviga frågan vid 17:01 en tisdag. Laga är platsen där ditt gäng samlar alla recept ni faktiskt lagar — inte 400 bortglömda flikar.',
  },
  {
    icon: 'users',
    title: 'Bättre tillsammans',
    body: 'En gemenskap kan vara familjen, kompisgänget eller kursen ni gick. Alla lägger till sina recept, ser vem som lagat vad och lämnar sina hemliga tweaks.',
  },
  {
    icon: 'camera',
    title: 'Fyll boken på sekunder',
    body: 'Klistra in en länk från Instagram eller TikTok, fota ett uppslag ur en kokbok, ta en skärmdump eller skriv själv — AI:n plockar ut titel, ingredienser och steg åt dig. Tryck på "Lägg till" för att börja.',
  },
  {
    icon: 'heart',
    title: 'Beröm, betyg & bestämda åsikter',
    body: 'Hjärta favoriterna, sätt betyg 1–6 efter du lagat, och starta lagläge som håller skärmen vaken medan du bockar av steg. Mormors köttbullar förtjänar en 6:a.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'intro' | 'finish'>('intro')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function finish(action: 'create' | 'join' | 'skip') {
    setBusy(true)
    setError('')
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, name, code }),
    })
    if (res.ok) {
      router.push('/laga')
      router.refresh()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Något gick fel')
      setBusy(false)
    }
  }

  const slide = SLIDES[step]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Logo size="lg" />
      </div>

      <div style={{ width: '100%', maxWidth: 440, background: 'var(--card)', border: '1px solid var(--card-bd)', borderRadius: 'var(--radius)', padding: '28px 26px' }}>
        {mode === 'intro' ? (
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: 16, background: 'var(--accent-soft)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={slide.icon} size={28} color="var(--accent)" />
            </span>
            <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '16px 0 10px' }}>{slide.title}</h1>
            <p style={{ fontSize: 15.5, color: 'var(--muted)', lineHeight: 1.55 }}>{slide.body}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '22px 0' }}>
              {SLIDES.map((_, i) => (
                <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === step ? 'var(--accent)' : 'var(--card-bd)' }} />
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => (step < SLIDES.length - 1 ? setStep(step + 1) : setMode('finish'))}
            >
              {step < SLIDES.length - 1 ? 'Nästa' : 'Kom igång'}
            </Button>
            {step < SLIDES.length - 1 && (
              <button onClick={() => setMode('finish')} style={{ marginTop: 12, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}>
                Hoppa över
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 6 }}>Skapa din gemenskap</h1>
              <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.5 }}>Ge den ett namn — familjen, gänget, kursen…</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="t.ex. Familjen Schiffer"
                  className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <Button onClick={() => finish('create')} disabled={busy || !name.trim()}>
                  Skapa
                </Button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--card-bd)', paddingTop: 18 }}>
              <h2 style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>…eller gå med via en kod</h2>
              <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>Har du fått en inbjudningskod?</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Inbjudningskod"
                  className="w-full rounded-lg border border-brand-accent/40 bg-white px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <Button variant="outline" onClick={() => finish('join')} disabled={busy || !code.trim()}>
                  Gå med
                </Button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button onClick={() => finish('skip')} disabled={busy} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}>
              Hoppa över för nu
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
