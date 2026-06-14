'use client'

import { signIn } from 'next-auth/react'

/** "Fortsätt med Google/Apple"-knappar. callbackUrl styr vart man landar efter login. */
export function OAuthButtons({ callbackUrl = '/laga' }: { callbackUrl?: string }) {
  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl })}
        style={{ ...base, background: '#fff', color: '#1f1f1f', border: '1px solid #dadce0' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
          <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
        </svg>
        Fortsätt med Google
      </button>
      <button
        type="button"
        onClick={() => signIn('apple', { callbackUrl })}
        style={{ ...base, background: '#000', color: '#fff', border: '1px solid #000' }}
      >
        <svg width="16" height="18" viewBox="0 0 16 18" fill="#fff" aria-hidden="true">
          <path d="M13.36 9.5c.02 2.3 2.02 3.07 2.04 3.08-.02.05-.32 1.1-1.06 2.18-.64.94-1.3 1.87-2.34 1.89-1.02.02-1.35-.6-2.52-.6-1.16 0-1.53.58-2.5.62-1 .04-1.77-1.01-2.41-1.94C3.16 12.8 2.16 9.3 3.5 6.94c.66-1.17 1.85-1.91 3.14-1.93.99-.02 1.92.66 2.52.66.6 0 1.74-.82 2.93-.7.5.02 1.9.2 2.8 1.52-.07.05-1.67.98-1.65 2.91l.02.1ZM11.36 3.5c.53-.64.89-1.53.79-2.42-.76.03-1.69.51-2.24 1.15-.49.56-.92 1.47-.8 2.33.85.07 1.71-.43 2.25-1.06Z" />
        </svg>
        Fortsätt med Apple
      </button>
    </div>
  )
}
