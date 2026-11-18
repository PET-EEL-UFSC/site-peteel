'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { caixasSchema } from '@/lib/certificado-modelo'
import { gerarPdfDeCertificado } from '@/lib/certificado'
import { atingeFrequenciaMinima } from '@/lib/presenca'
import type { Resultado } from './acoes'

const TIPOS_DE_FUNDO = ['image/png', 'image/jpeg']

export type ResultadoModelo = { ok: true; id: string; mensagem: string } | { ok: false; erro: string }

/** Só o fundo PNG/JPG funciona no PDF; confere aqui em vez de falhar na hora de gerar. */
async function validarFundo(fundoMidiaId: string | null): Promise<string | null> {
  if (!fundoMidiaId) return null
  const m = await db.midia.findUnique({ where: { id: fundoMidiaId }, select: { mimeType: true } })
  if (!m) return 'imagem de fundo não encontrada'
  if (!TIPOS_DE_FUNDO.includes(m.mimeType)) return 'o fundo precisa ser uma imagem PNG ou JPG'
  return null
}

export async function salvarModeloCertificado(dados: {
  id: string | null
  nome: string
  fundoMidiaId: string | null
  caixas: unknown
}): Promise<ResultadoModelo> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const nome = dados.nome.trim()
  if (nome.length < 2 || nome.length > 80) return { ok: false, erro: 'o nome do modelo precisa ter de 2 a 80 letras' }

  const caixas = caixasSchema.safeParse(dados.caixas)
  if (!caixas.success) return { ok: false, erro: `caixa de texto inválida: ${caixas.error.issues[0]?.message ?? 'confira os valores'}` }

  const problema = await validarFundo(dados.fundoMidiaId)
  if (problema) return { ok: false, erro: problema }

  const data = { nome, fundoMidiaId: dados.fundoMidiaId, caixas: caixas.data }
  let id: string
  if (dados.id) {
    const existe = await db.modeloCertificado.findUnique({ where: { id: dados.id }, select: { id: true } })
    if (!existe) return { ok: false, erro: 'modelo não encontrado' }
    await db.modeloCertificado.update({ where: { id: dados.id }, data })
    id = dados.id
  } else {
    id = (await db.modeloCertificado.create({ data, select: { id: true } })).id
  }

  revalidatePath('/admin/minicursos', 'layout')
  return { ok: true, id, mensagem: 'Modelo salvo.' }
}

export async function apagarModeloCertificado(id: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const emUso = await db.minicurso.count({ where: { modeloCertificadoId: id } })
  if (emUso > 0) return { ok: false, erro: `este modelo é usado por ${emUso} minicurso(s); troque o modelo deles antes` }

  await db.modeloCertificado.delete({ where: { id } })
  revalidatePath('/admin/minicursos', 'layout')
  return { ok: true, mensagem: 'Modelo apagado.' }
}

/**
 * PDF de exemplo com o modelo que está sendo editado (mesmo sem salvar),
 * pra ver o resultado de verdade, e não uma simulação em HTML.
 */
export async function previaModeloCertificado(dados: {
  fundoMidiaId: string | null
  caixas: unknown
}): Promise<{ ok: true; pdfBase64: string } | { ok: false; erro: string }> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const caixas = caixasSchema.safeParse(dados.caixas)
  if (!caixas.success) return { ok: false, erro: `caixa de texto inválida: ${caixas.error.issues[0]?.message ?? 'confira os valores'}` }

  const problema = await validarFundo(dados.fundoMidiaId)
  if (problema) return { ok: false, erro: problema }

  const fundo = dados.fundoMidiaId ? await db.midia.findUnique({ where: { id: dados.fundoMidiaId }, select: { url: true } }) : null

  // pra baixar imagem enviada em dev (endereço relativo) precisa saber onde o site está
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const base = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}/`

  const pdf = await gerarPdfDeCertificado(
    { nome: 'Maria da Silva Santos', minicurso: 'Introdução à Inteligência Artificial', cargaHoraria: 12, emitidoEm: new Date() },
    { caixas: caixas.data, fundoMidia: fundo },
    base
  )
  return { ok: true, pdfBase64: Buffer.from(pdf).toString('base64') }
}

// ─────────────────────────── liberar certificados ───────────────────────────

export async function liberarCertificado(inscricaoId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  // só carimba a data se ainda não tinha: a data do certificado não muda a cada clique
  await db.inscricao.updateMany({ where: { id: inscricaoId, certificadoEm: null }, data: { certificadoEm: new Date() } })
  revalidatePath('/admin/minicursos', 'layout')
  return { ok: true, mensagem: 'Certificado liberado.' }
}

/** Bloqueia um certificado gerado. O PDF enviado à mão se tira com "Remover PDF", que também apaga o arquivo. */
export async function bloquearCertificado(inscricaoId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  await db.inscricao.updateMany({ where: { id: inscricaoId, certificadoUrl: null }, data: { certificadoEm: null } })
  revalidatePath('/admin/minicursos', 'layout')
  return { ok: true, mensagem: 'Certificado bloqueado.' }
}

/**
 * Libera os certificados ainda pendentes do minicurso: de todos, ou só de
 * quem atingiu a frequência mínima (em %) nos encontros registrados.
 */
export async function liberarCertificados(minicursoId: string, minimoPercentual: number | null): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  if (minimoPercentual === null) {
    const r = await db.inscricao.updateMany({ where: { minicursoId, certificadoEm: null }, data: { certificadoEm: new Date() } })
    revalidatePath('/admin/minicursos', 'layout')
    return { ok: true, mensagem: `${r.count} certificado(s) liberado(s).` }
  }

  if (!Number.isInteger(minimoPercentual) || minimoPercentual < 1 || minimoPercentual > 100) {
    return { ok: false, erro: 'frequência mínima inválida (de 1 a 100)' }
  }

  const encontros = await db.encontro.count({ where: { minicursoId } })
  if (encontros === 0) return { ok: false, erro: 'este minicurso ainda não tem encontros registrados' }

  const pendentes = await db.inscricao.findMany({
    where: { minicursoId, certificadoEm: null },
    select: { id: true, _count: { select: { presencas: true } } },
  })
  const elegiveis = pendentes.filter((i) => atingeFrequenciaMinima(i._count.presencas, encontros, minimoPercentual)).map((i) => i.id)
  if (elegiveis.length) {
    await db.inscricao.updateMany({ where: { id: { in: elegiveis } }, data: { certificadoEm: new Date() } })
  }

  revalidatePath('/admin/minicursos', 'layout')
  const sem = pendentes.length - elegiveis.length
  return { ok: true, mensagem: `${elegiveis.length} certificado(s) liberado(s)${sem ? `; ${sem} ficaram abaixo de ${minimoPercentual}%` : ''}.` }
}
