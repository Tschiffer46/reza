'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/laga/ui'

/**
 * Helskärms-lagläge: håller skärmen vaken (Wake Lock) och fokuserar på nästa
 * steg. Klarmarkerade steg dämpas; nästa omarkerade steg visas överst.
 */
export function CookMode({
  title,
  steps,
  onClose,
}: {
  title: string
  steps: string[]
  onClose: () => void
}) {
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false))

  // Wake Lock — håll skärmen tänd, återbegär när fliken blir aktiv igen.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    let released = false
    const request = async () => {
      try {
        lock = await navigator.wakeLock?.request('screen')
      } catch {
        /* stöds inte / nekad — ignorera */
      }
    }
    request()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !released) request()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [])

  const nextIndex = done.findIndex((d) => !d)
  const allDone = nextIndex === -1

  function toggle(i: number) {
    setDone((prev) => prev.map((d, idx) => (idx === i ? !d : d)))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--bg)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 18px 40px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Lagar nu
            </div>
            <h1 style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.15 }}>{title}</h1>
          </div>
          <button
            onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--card)', border: '1px solid var(--card-bd)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--ink)', flexShrink: 0 }}
          >
            <Icon name="x" size={16} /> Avsluta
          </button>
        </div>

        {/* nästa steg, prominent */}
        {!allDone ? (
          <div style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius)', padding: '20px 22px', marginBottom: 24 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
              Steg {nextIndex + 1} av {steps.length}
            </div>
            <p style={{ fontSize: 20, lineHeight: 1.5, color: 'var(--ink)' }}>{steps[nextIndex]}</p>
            <button
              onClick={() => toggle(nextIndex)}
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', cursor: 'pointer', fontSize: 15.5, fontWeight: 600 }}
            >
              <Icon name="check" size={18} color="#fff" /> Klar med steget
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius)', padding: '24px 22px', marginBottom: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Klart! 🎉 Smaklig måltid.</p>
            <button onClick={onClose} style={{ marginTop: 14, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', cursor: 'pointer', fontSize: 15.5, fontWeight: 600 }}>
              Avsluta lagläge
            </button>
          </div>
        )}

        {/* alla steg */}
        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => toggle(i)}
                style={{
                  display: 'flex',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 0',
                  opacity: done[i] ? 0.4 : 1,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: '2px solid ' + (done[i] ? 'var(--accent)' : 'var(--card-bd)'),
                    background: done[i] ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  {done[i] ? <Icon name="check" size={15} color="#fff" /> : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{i + 1}</span>}
                </span>
                <span style={{ fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink)', textDecoration: done[i] ? 'line-through' : 'none' }}>{s}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
