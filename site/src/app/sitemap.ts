import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { SITE_URL } from '@/lib/site-url'

// Páginas publicadas e inscrições abertas mudam pelo painel: nada de sitemap congelado no build.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [paginas, minicursos] = await Promise.all([
    // página de minicurso (minicursoId preenchido) é restrita ao aluno: fica de fora
    db.pagina.findMany({
      where: { status: 'PUBLICADA', minicursoId: null },
      select: { slug: true, atualizadoEm: true },
      orderBy: { slug: 'asc' },
    }),
    db.minicurso.findMany({
      where: { ativo: true, inscricoesAbertas: true },
      select: { slug: true, criadoEm: true },
    }),
  ])

  const url = (slug: string) => (slug === '/' ? SITE_URL : `${SITE_URL}${slug}`)

  return [
    ...paginas.map((p) => ({
      url: url(p.slug),
      lastModified: p.atualizadoEm,
      priority: p.slug === '/' ? 1 : 0.7,
    })),
    ...(minicursos.length > 0
      ? [
          { url: `${SITE_URL}/inscricao`, priority: 0.5 },
          ...minicursos.map((m) => ({ url: `${SITE_URL}/inscricao/${m.slug}`, lastModified: m.criadoEm, priority: 0.5 })),
        ]
      : []),
  ]
}
