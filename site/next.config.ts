import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    // uploads locais em dev; em produção o Blob serve de outro host
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }],
  },
  async headers() {
    // Área do aluno e certificados dependem de quem está logado: nenhum
    // cache compartilhado (CDN, proxy) pode guardar essas respostas, e
    // buscador não tem o que indexar ali.
    const privado = [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ]
    return [
      { source: '/aluno/:path*', headers: privado },
      { source: '/api/aluno/:path*', headers: privado },
    ]
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
