import type { MetadataRoute } from 'next'
import { getAllRecipes } from '@/lib/recipes'
import { apps } from '@/lib/apps'
import { siteConfig } from '@/lib/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url
  const now = new Date()

  const staticPaths = [
    '',
    '/appar',
    ...apps.map((a) => `/appar/${a.slug}`),
    '/recept',
    '/om',
    '/kontakt',
    '/integritetspolicy',
    '/anvandarvillkor',
    '/cookiepolicy',
    '/om-annonslankar',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.7,
  }))

  const recipeEntries: MetadataRoute.Sitemap = getAllRecipes().map((r) => ({
    url: `${base}/recept/${r.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticEntries, ...recipeEntries]
}
