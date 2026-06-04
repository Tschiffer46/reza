import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorker } from '@/components/ServiceWorker'

export const metadata: Metadata = {
  title: 'VadSkaVi — familjens receptbok',
  description: 'Samla, dela och hitta familjens favoritrecept',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VadSkaVi',
  },
}

export const viewport: Viewport = {
  themeColor: '#1C3A2B',
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
