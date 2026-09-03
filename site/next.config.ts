import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    // uploads locais em dev; em produção o Blob serve de outro host
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }],
  },
  experimental: {
    // Server Actions limitam o corpo a 1 MB por padrão — bem menor que
    // os 8 MB que o storage.ts já permite. Sem isso, upload de foto
    // grande dá 413 antes de chegar no nosso código.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default config
