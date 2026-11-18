import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'
import { caixasSchema, CAIXAS_PADRAO } from '@/lib/certificado-modelo'
import { ModelosCertificado } from '../../_componentes/ModelosCertificado'

export default async function ModelosPage() {
  await exigirPermissao('gerenciarMinicursos')

  const [modelos, midias] = await Promise.all([
    db.modeloCertificado.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, fundoMidiaId: true, caixas: true, _count: { select: { minicursos: true } } },
    }),
    // o PDF só embute PNG e JPG
    db.midia.findMany({
      where: { mimeType: { in: ['image/png', 'image/jpeg'] } },
      orderBy: { criadoEm: 'desc' },
      take: 200,
      select: { id: true, url: true, alt: true, largura: true, altura: true },
    }),
  ])

  return (
    <>
      <Link href="/admin/minicursos" style={{ font: '700 12px var(--condensada)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        ← Minicursos
      </Link>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', margin: '14px 0 6px' }}>Modelos de certificado</h1>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '72ch' }}>
        Um modelo é a <strong>arte de fundo</strong> do certificado (imagem PNG ou JPG em A4 paisagem, enviada em{' '}
        <Link href="/admin/midia" style={{ textDecoration: 'underline' }}>Imagens</Link>) mais as <strong>caixas de texto</strong> que o site
        escreve por cima, com os dados de cada aluno. Se a arte já tiver a assinatura do tutor, ela sai em todos os certificados. Depois é só
        escolher o modelo no cartão de cada minicurso.
      </p>
      <ModelosCertificado
        midias={midias}
        modelos={modelos.map((m) => {
          const caixas = caixasSchema.safeParse(m.caixas)
          return { id: m.id, nome: m.nome, fundoMidiaId: m.fundoMidiaId, caixas: caixas.success ? caixas.data : CAIXAS_PADRAO, usos: m._count.minicursos }
        })}
      />
    </>
  )
}
