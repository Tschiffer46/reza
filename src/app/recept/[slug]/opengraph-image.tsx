import { ImageResponse } from 'next/og'
import { getAllRecipes, getRecipeBySlug } from '@/lib/recipes'

export const alt = 'Recept på VadSkaVi'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return getAllRecipes().map((r) => ({ slug: r.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recipe = getRecipeBySlug(slug)
  const title = recipe?.title ?? 'Recept'
  const category = recipe?.category ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #c75b39, #3f7d63)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 2,
            opacity: 0.9,
          }}
        >
          {category}
        </div>
        <div style={{ display: 'flex', fontSize: 78, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, opacity: 0.95 }}>VadSkaVi</div>
      </div>
    ),
    { ...size },
  )
}
