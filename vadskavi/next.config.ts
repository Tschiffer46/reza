import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // vadskavi ligger som undermapp i reza-repot; begränsa standalone-tracing till
  // denna mapp så att förälderns lockfile inte dras in i Docker-imagen.
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
