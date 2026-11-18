import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirAcessoATurma } from '@/lib/auth/turma'
import { formatarDataCurta } from '@/lib/presenca'
import { MarcarPresenca } from '../../../_componentes/MarcarPresenca'

export default async function EncontroPage({ params }: { params: Promise<{ minicursoId: string; encontroId: string }> }) {
  const { minicursoId, encontroId } = await params
  await exigirAcessoATurma(minicursoId)

  // o encontro tem que ser desta turma: sem isso, dava pra abrir encontro de outra pela URL
  const encontro = await db.encontro.findFirst({
    where: { id: encontroId, minicursoId },
    select: {
      data: true,
      titulo: true,
      minicurso: { select: { titulo: true, inscricoes: { orderBy: { aluno: { nome: 'asc' } }, select: { id: true, aluno: { select: { nome: true } } } } } },
      presencas: { select: { inscricaoId: true } },
    },
  })
  if (!encontro) notFound()

  const presentes = new Set(encontro.presencas.map((p) => p.inscricaoId))

  return (
    <>
      <Link href={`/admin/presenca/${minicursoId}`} style={{ font: '700 12px var(--condensada)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        ← {encontro.minicurso.titulo}
      </Link>
      <h1 style={{ fontSize: 30, lineHeight: 1, textTransform: 'uppercase', margin: '14px 0 6px' }}>
        {formatarDataCurta(encontro.data)}
        {encontro.titulo ? `: ${encontro.titulo}` : ''}
      </h1>
      <MarcarPresenca
        encontroId={encontroId}
        alunos={encontro.minicurso.inscricoes.map((i) => ({ inscricaoId: i.id, nome: i.aluno.nome, presente: presentes.has(i.id) }))}
      />
    </>
  )
}
