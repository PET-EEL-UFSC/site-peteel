import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth/sessao'
import { pode } from '@/lib/auth/acesso'
import { NovaPagina } from './_componentes/NovaPagina'

export default async function ListaPaginas() {
  const u = await exigirUsuario()

  const paginas = await db.pagina.findMany({
    select: {
      id: true, slug: true, titulo: true, status: true, rascunho: true, fixa: true,
      atualizadoEm: true, paiId: true,
      pai: { select: { titulo: true } },
    },
    orderBy: [{ ordem: 'asc' }, { slug: 'asc' }],
  })

  const raizes = paginas.filter((p) => !p.paiId)
  const ordenadas = raizes.flatMap((r) => [r, ...paginas.filter((p) => p.paiId === r.id)])
  const orfas = paginas.filter((p) => p.paiId && !raizes.some((r) => r.id === p.paiId))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
        <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase' }}>Páginas</h1>
        <span style={{ font: '400 14px var(--corpo)', color: 'rgba(44,43,34,0.6)' }}>
          {paginas.length} páginas · {paginas.filter((p) => p.rascunho).length} com rascunho não publicado
        </span>
      </div>

      {pode(u.papel, 'criarPagina') && <NovaPagina raizes={raizes.map((r) => ({ id: r.id, titulo: r.titulo }))} />}

      <table className="tabela" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Página</th>
            <th>Endereço</th>
            <th>Situação</th>
            <th style={{ width: 120 }}></th>
          </tr>
        </thead>
        <tbody>
          {[...ordenadas, ...orfas].map((p) => (
            <tr key={p.id}>
              <td>
                <span style={{ paddingLeft: p.paiId ? 22 : 0, font: p.paiId ? '400 14px var(--corpo)' : '700 14px var(--corpo)' }}>
                  {p.paiId && <span style={{ color: 'rgba(44,43,34,0.35)', marginRight: 6 }}>└</span>}
                  {p.titulo}
                </span>
                {p.fixa && (
                  <span className="tag" style={{ marginLeft: 8, background: 'rgba(44,43,34,0.1)', color: 'rgba(44,43,34,0.6)' }}>fixa</span>
                )}
              </td>
              <td style={{ font: '400 13px var(--condensada)', color: 'rgba(44,43,34,0.6)' }}>{p.slug}</td>
              <td>
                {p.status === 'PUBLICADA' ? (
                  <span className="tag" style={{ background: 'var(--amarelo)', color: 'var(--escuro)' }}>no ar</span>
                ) : (
                  <span className="tag" style={{ background: 'rgba(44,43,34,0.12)', color: 'rgba(44,43,34,0.7)' }}>rascunho</span>
                )}
                {p.rascunho ? (
                  <span className="tag" style={{ marginLeft: 6, background: 'var(--azul)', color: '#fff' }}>alterações não publicadas</span>
                ) : null}
              </td>
              <td style={{ textAlign: 'right' }}>
                <Link href={`/admin/paginas/${p.id}`} className="btn btn-claro" style={{ display: 'inline-block' }}>
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
