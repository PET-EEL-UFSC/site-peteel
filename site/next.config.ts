import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    // uploads locais em dev; em produção o Blob serve de outro host
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }],
  },
}

export default config
