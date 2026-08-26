import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth/sessao'
import { pode } from '@/lib/auth/acesso'
import { lerBlocos } from '@/lib/content/pagina'
import { EditorBlocos } from '../../_componentes/EditorBlocos'
import { Revisoes } from '../../_componentes/Revisoes'

export default async function EditarPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await exigirUsuario()

  const [pagina, midias, revisoes] = await Promise.all([
    db.pagina.findUnique({ where: { id } }),
    db.midia.findMany({ select: { id: true, url: true, alt: true }, orderBy: { criadoEm: 'desc' }, take: 200 }),
    db.paginaRevisao.findMany({
      where: { paginaId: id },
      select: { id: true, criadoEm: true, resumo: true, autor: { select: { nome: true, email: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 10,
    }),
  ])

  if (!pagina) notFound()

  // o editor abre no rascunho quando existe; senão no que está no ar
  const fonte = pagina.rascunho ?? pagina.blocos
  const blocos = lerBlocos(fonte, `editor da página ${pagina.slug}`)

  return (
    <>
      <EditorBlocos
        paginaId={pagina.id}
        slug={pagina.slug}
        titulo={pagina.titulo}
        inicial={blocos}
        temRascunho={pagina.rascunho !== null}
        podePublicar={pode(u.papel, 'publicar')}
        midias={midias}
      />
      {pode(u.papel, 'publicar') && revisoes.length > 0 && <Revisoes revisoes={revisoes.map((r) => ({ ...r, criadoEm: r.criadoEm.toISOString() }))} />}
    </>
  )
}
