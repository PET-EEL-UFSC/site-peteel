'use server'

import { db } from '@/lib/db'
import { JANELA_PEDIDOS_MIN, MAX_PEDIDOS_NA_JANELA, MAX_PEDIDOS_PENDENTES, validarPedidoDeInscricao } from '@/lib/inscricao'

export type ResultadoEnvio = { ok: true } | { ok: false; erro: string }

/**
 * Sem login: qualquer pessoa pode chamar. Por isso só grava um PEDIDO
 * (PreInscricao), nunca um acesso: quem organiza aprova no painel. A
 * resposta é a mesma pra quem já está inscrito ou já tinha pedido, pra o
 * formulário não servir pra descobrir quem está em qual minicurso.
 */
export async function enviarPreInscricao(slug: string, formData: FormData): Promise<ResultadoEnvio> {
  const r = validarPedidoDeInscricao({
    nome: formData.get('nome'),
    email: formData.get('email'),
    matricula: formData.get('matricula'),
    empresa: formData.get('empresa'),
    tempoMs: formData.get('tempoMs'),
  })
  if (r.ok === 'descartar') return { ok: true }
  if (r.ok === false) return { ok: false, erro: r.erro }

  const minicurso = await db.minicurso.findUnique({
    where: { slug },
    select: { id: true, ativo: true, inscricoesAbertas: true },
  })
  if (!minicurso || !minicurso.ativo || !minicurso.inscricoesAbertas) {
    return { ok: false, erro: 'As inscrições deste minicurso não estão abertas.' }
  }

  // freio contra enchente de pedidos falsos: limite por janela de tempo e no total de pendentes
  const desde = new Date(Date.now() - JANELA_PEDIDOS_MIN * 60 * 1000)
  const [recentes, pendentes] = await Promise.all([
    db.preInscricao.count({ where: { minicursoId: minicurso.id, criadoEm: { gt: desde } } }),
    db.preInscricao.count({ where: { minicursoId: minicurso.id } }),
  ])
  if (recentes >= MAX_PEDIDOS_NA_JANELA || pendentes >= MAX_PEDIDOS_PENDENTES) {
    return { ok: false, erro: 'Muitos pedidos agora. Tente de novo em alguns minutos.' }
  }

  const { nome, email, matricula } = r.pedido

  const jaInscrito = await db.inscricao.findFirst({ where: { minicursoId: minicurso.id, aluno: { email } }, select: { id: true } })
  if (jaInscrito) return { ok: true }

  // refazer o pedido corrige nome/matrícula digitados errados
  await db.preInscricao.upsert({
    where: { minicursoId_email: { minicursoId: minicurso.id, email } },
    update: { nome, matricula },
    create: { minicursoId: minicurso.id, email, nome, matricula },
  })
  return { ok: true }
}
