'use client'

/** Öppnar consent-bannern igen (t.ex. från footern). ConsentBanner lyssnar på eventet. */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('vadskavi:open-consent'))}
      className="text-left text-brand-muted transition-colors hover:text-brand-accent sm:text-right"
    >
      Cookie-inställningar
    </button>
  )
}
