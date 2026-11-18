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
      modeloCertificado: { select: { nome: true } },
      _count: { select: { encontros: true } },
      inscricoes: {
        orderBy: { aluno: { nome: 'asc' } },
        select: {
          id: true,
          certificadoNome: true,
          certificadoUrl: true,
          certificadoEm: true,
          aluno: { select: { nome: true, email: true } },
          _count: { select: { presencas: true } },
        },
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
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '70ch' }}>
        Ao <strong>liberar</strong>, o site gera o certificado do aluno pelo modelo{' '}
        <strong>{minicurso.modeloCertificado?.nome ?? 'padrão do site'}</strong> (troque o modelo no cartão do minicurso). Se preferir, envie um
        <strong> PDF próprio</strong> de um aluno: ele vale no lugar do gerado. O aluno só vê e baixa o <strong>próprio</strong> certificado, na
        Área do aluno. Use &quot;Abrir&quot; pra conferir antes de seguir.
      </p>
      <CertificadosMinicurso
        minicursoId={id}
        encontros={minicurso._count.encontros}
        inscricoes={minicurso.inscricoes.map((i) => ({
          id: i.id,
          nome: i.aluno.nome,
          email: i.aluno.email,
          estado: i.certificadoUrl ? 'enviado' : i.certificadoEm ? 'gerado' : 'pendente',
          arquivo: i.certificadoUrl ? (i.certificadoNome ?? 'certificado.pdf') : null,
          presencas: i._count.presencas,
        }))}
      />
    </>
  )
}
