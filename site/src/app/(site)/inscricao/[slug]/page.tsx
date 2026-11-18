import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { FormInscricao } from '../FormInscricao'

// Abrir/fechar inscrições tem que valer na hora, sem cache.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function buscar(slug: string) {
  const m = await db.minicurso.findUnique({ where: { slug }, select: { titulo: true, cargaHoraria: true, ativo: true, inscricoesAbertas: true } })
  return m && m.ativo && m.inscricoesAbertas ? m : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const m = await buscar(slug)
  return { title: m ? `Inscrição: ${m.titulo}` : 'Inscrição' }
}

export default async function Inscricao({ params }: Props) {
  const { slug } = await params
  // só título e carga horária: a descrição e o resto são material dos alunos, não da página pública
  const m = await buscar(slug)
  if (!m) notFound()

  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: '54px 28px 88px' }}>
      <p style={{ font: '900 11px/1 var(--condensada)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(44,43,34,0.6)' }}>Inscrição em minicurso</p>
      <h1 style={{ marginTop: 12, fontSize: 'clamp(30px,4vw,44px)', lineHeight: 1, textTransform: 'uppercase' }}>{m.titulo}</h1>
      {m.cargaHoraria && <p style={{ marginTop: 10, font: '700 13px var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{m.cargaHoraria} horas</p>}
      <p style={{ margin: '20px 0 28px', font: '400 16px/1.6 var(--corpo)' }}>
        Preencha seus dados. A organização aprova o pedido e você passa a ter acesso às aulas e ao certificado na Área do aluno.
      </p>
      <FormInscricao slug={slug} />
    </section>
  )
}
