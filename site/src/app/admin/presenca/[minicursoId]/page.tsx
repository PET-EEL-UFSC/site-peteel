import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirAcessoATurma } from '@/lib/auth/turma'
import { percentualDePresenca, formatarDataCurta } from '@/lib/presenca'
import { Encontros } from '../../_componentes/Encontros'

export default async function TurmaPage({ params }: { params: Promise<{ minicursoId: string }> }) {
  const { minicursoId } = await params
  await exigirAcessoATurma(minicursoId)

  const m = await db.minicurso.findUnique({
    where: { id: minicursoId },
    select: {
      titulo: true,
      encontros: {
        orderBy: [{ data: 'asc' }, { criadoEm: 'asc' }],
        select: { id: true, data: true, titulo: true, _count: { select: { presencas: true } } },
      },
      inscricoes: {
        orderBy: { aluno: { nome: 'asc' } },
        select: { id: true, aluno: { select: { nome: true } }, _count: { select: { presencas: true } } },
      },
    },
  })
  if (!m) notFound()

  const total = m.encontros.length

  return (
    <>
      <Link href="/admin/presenca" style={{ font: '700 12px var(--condensada)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        ← Presença
      </Link>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', margin: '14px 0 6px' }}>{m.titulo}</h1>
      <p className="dica" style={{ marginBottom: 20 }}>{m.inscricoes.length} aluno(s) inscrito(s) · {total} encontro(s)</p>

      <Encontros
        minicursoId={minicursoId}
        inscritos={m.inscricoes.length}
        encontros={m.encontros.map((e) => ({ id: e.id, data: formatarDataCurta(e.data), titulo: e.titulo, presentes: e._count.presencas }))}
      />

      {m.inscricoes.length > 0 && total > 0 && (
        <>
          <h2 style={{ fontSize: 18, textTransform: 'uppercase', margin: '30px 0 10px' }}>Frequência</h2>
          <table className="tabela" style={{ maxWidth: 560 }}>
            <thead>
              <tr><th>Aluno</th><th>Presenças</th><th>%</th></tr>
            </thead>
            <tbody>
              {m.inscricoes.map((i) => (
                <tr key={i.id}>
                  <td>{i.aluno.nome}</td>
                  <td>{i._count.presencas}/{total}</td>
                  <td>{percentualDePresenca(i._count.presencas, total)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}
