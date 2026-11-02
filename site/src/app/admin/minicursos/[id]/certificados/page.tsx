import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'
import { CertificadosMinicurso } from '../../../_componentes/CertificadosMinicurso'

export default async function CertificadosPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirPermissao('gerenciarMinicursos')
  const { id } = await params

  const minicurso = await db.minicurso.findUnique({
    where: { id },
    select: {
      titulo: true,
      inscricoes: {
        orderBy: { aluno: { nome: 'asc' } },
        select: { id: true, certificadoNome: true, certificadoEm: true, aluno: { select: { nome: true, email: true } } },
      },
    },
  })
  if (!minicurso) notFound()

  return (
    <>
      <Link href="/admin/minicursos" style={{ font: '700 12px var(--condensada)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        ← Minicursos
      </Link>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', margin: '14px 0 6px' }}>Certificados</h1>
      <p style={{ font: '700 15px var(--corpo)', marginBottom: 8 }}>{minicurso.titulo}</p>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '68ch' }}>
        Envie o PDF já assinado de cada aluno. O aluno só vê e baixa o <strong>próprio</strong> certificado, na Área do aluno, assim que o arquivo é enviado.
        Confira com &quot;Abrir&quot; se o PDF é mesmo da pessoa da linha antes de seguir: o site não lê o conteúdo do arquivo.
      </p>
      <CertificadosMinicurso
        inscricoes={minicurso.inscricoes.map((i) => ({
          id: i.id,
          nome: i.aluno.nome,
          email: i.aluno.email,
          arquivo: i.certificadoEm ? (i.certificadoNome ?? 'certificado.pdf') : null,
        }))}
      />
    </>
  )
}
