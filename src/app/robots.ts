import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Den inloggade appen och interna ytor ska inte indexeras.
      disallow: ['/laga', '/admin', '/api', '/login', '/register', '/onboarding', '/join'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
