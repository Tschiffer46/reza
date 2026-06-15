'use client'

import { useEffect } from 'react'

/** Registrerar PWA service worker i produktion. */
export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
