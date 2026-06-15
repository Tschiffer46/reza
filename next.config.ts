import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Lås standalone-tracing till repo-roten så att rätt lockfile används.
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ['sharp'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
