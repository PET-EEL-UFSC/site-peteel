import type { MetadataRoute } from 'next'
import { SITE_URL, CAMINHOS_RESTRITOS } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: CAMINHOS_RESTRITOS.map((c) => `${c}/`).concat(CAMINHOS_RESTRITOS) }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
