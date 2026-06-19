'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KEY = 'vadskavi-consent'

interface Consent {
  necessary: true
  analytics: boolean
  marketing: boolean
  ts: string
}

/**
 * Lättviktig, förstaparts cookie-samtyckesbanner (CMP).
 *
 * Idag sätter sajten bara den nödvändiga sessionscookien, så det finns inget icke-
 * nödvändigt att blockera — men bannern är den fungerande grinden som krävs av
 * Adtraction/GDPR och som framtida analys/affiliate-skript ska gatas bakom. Valet
 * sparas i localStorage. Footerns "Cookie-inställningar" öppnar bannern igen.
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    let stored: Consent | null = null
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) stored = JSON.parse(raw) as Consent
    } catch {
      /* localStorage kan vara blockerat – visa bannern */
    }
    if (!stored) {
      setOpen(true)
    } else {
      setAnalytics(stored.analytics)
      setMarketing(stored.marketing)
    }
    const reopen = () => setOpen(true)
    window.addEventListener('vadskavi:open-consent', reopen)
    return () => window.removeEventListener('vadskavi:open-consent', reopen)
  }, [])

  function save(a: boolean, m: boolean) {
    const consent: Consent = {
      necessary: true,
      analytics: a,
      marketing: m,
      ts: new Date().toISOString(),
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(consent))
    } catch {
      /* ignorera – valet gäller åtminstone denna session */
    }
    setAnalytics(a)
    setMarketing(m)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie-samtycke"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-brand-line bg-brand-surface p-5 shadow-2xl">
        <h2 className="text-base font-semibold text-brand-header">Vi värnar din integritet</h2>
        <p className="mt-2 text-sm text-brand-muted">
          Vi använder bara nödvändiga cookies för att sajten ska fungera. Övriga kategorier
          (analys och marknadsföring) är avstängda tills du själv väljer att tillåta dem. Läs
          mer i vår{' '}
          <Link href="/cookiepolicy" className="text-brand-accent underline">
            cookiepolicy
          </Link>
          .
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-3 text-brand-muted">
            <input type="checkbox" checked readOnly className="h-4 w-4 accent-[var(--accent)]" />
            <span>
              <span className="font-medium text-brand-ink">Nödvändiga</span> – krävs för
              inloggning och säkerhet (alltid på).
            </span>
          </label>
          <label className="flex items-center gap-3 text-brand-ink">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              <span className="font-medium">Analys</span> – hjälper oss förstå hur sajten används.
            </span>
          </label>
          <label className="flex items-center gap-3 text-brand-ink">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              <span className="font-medium">Marknadsföring</span> – mätning av annons- och
              affiliate-länkar.
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => save(true, true)}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-dark"
          >
            Acceptera alla
          </button>
          <button
            type="button"
            onClick={() => save(analytics, marketing)}
            className="rounded-lg border border-brand-accent px-4 py-2 text-sm font-medium text-brand-header transition-colors hover:bg-brand-accent/10"
          >
            Spara mitt val
          </button>
          <button
            type="button"
            onClick={() => save(false, false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-ink"
          >
            Endast nödvändiga
          </button>
        </div>
      </div>
    </div>
  )
}
