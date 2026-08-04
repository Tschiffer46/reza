import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorker } from '@/components/ServiceWorker'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: 'VadSkaVi — enkla appar för vardagen',
  description:
    'Små, enkla appar för vardagen: Laga för familjens recept och Gymma för träningsloggen. Byggda i Sverige, driftade i Europa, utan spårning.',
  applicationName: siteConfig.name,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VadSkaVi',
  },
  // Bara strukturella OG-/Twitter-fält här. Titel/beskrivning utelämnas medvetet
  // så att varje sidas egna title/description fyller i og:title/og:description
  // (annars ärvs rotens värden och alla sidor får samma delningsrubrik).
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: 'sv_SE',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export const viewport: Viewport = {
  // Matchar headerns bakgrund (--ink). Var tidigare en grön rest från en
  // avvecklad palett och stämde inte med något på sajten.
  themeColor: '#1a1a18',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" className="h-full">
      <body className="min-h-full antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  )
}
