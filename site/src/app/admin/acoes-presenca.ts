'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { lerDataISO } from '@/lib/presenca'
import type { Resultado } from './acoes'

const MAX_ENCONTROS = 60

/**
 * Marcar presença é de quem dá o minicurso. Administrador vale pra qualquer
 * turma; editor só pras turmas em que foi marcado como ministrante. A
 * permissão geral não basta: sem essa checagem, qualquer editor mexeria na
 * presença (e, por ela, na liberação do certificado) de turmas alheias.
 */
async function exigirTurma(minicursoId: string): Promise<void> {
  const u = await exigirPermissaoAction('registrarPresenca')
  if (u.papel === 'ADMIN') return
  const vinculo = await db.minicursoMinistrante.findUnique({
    where: { minicursoId_userId: { minicursoId, userId: u.id } },
    select: { userId: true },
  })
  if (!vinculo) throw new Error('você não é ministrante deste minicurso')
}

/**
 * Mesmo portão, partindo do id do encontro. A permissão é conferida antes de
 * olhar o banco, e "encontro que não existe" e "turma que não é sua" dão a
 * mesma resposta, pra a ação não servir pra descobrir quais ids existem.
 */
async function exigirEncontro(encontroId: string): Promise<string> {
  const u = await exigirPermissaoAction('registrarPresenca')
  const e = await db.encontro.findUnique({ where: { id: encontroId }, select: { minicursoId: true } })
  if (!e) throw new Error('encontro não encontrado')
  if (u.papel !== 'ADMIN') {
    const vinculo = await db.minicursoMinistrante.findUnique({
      where: { minicursoId_userId: { minicursoId: e.minicursoId, userId: u.id } },
      select: { userId: true },
    })
    if (!vinculo) throw new Error('encontro não encontrado')
  }
  return e.minicursoId
}

/** Quem organiza os minicursos define quem ministra: pessoas do grupo (admin/editor ativos). */
export async function definirMinistrantes(minicursoId: string, userIds: string[]): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const unicos = [...new Set(userIds)]
  const validos = await db.user.findMany({
    where: { id: { in: unicos }, papel: { in: ['ADMIN', 'EDITOR'] }, ativo: true },
    select: { id: true },
  })
  if (validos.length !== unicos.length) return { ok: false, erro: 'só pessoas do grupo (admin ou editor ativo) podem ministrar' }

  await db.$transaction([
    db.minicursoMinistrante.deleteMany({ where: { minicursoId } }),
    db.minicursoMinistrante.createMany({ data: validos.map((v) => ({ minicursoId, userId: v.id })) }),
  ])
  revalidatePath('/admin/minicursos', 'layout')
  revalidatePath('/admin/presenca', 'layout')
  return { ok: true, mensagem: 'Ministrantes atualizados.' }
}

export async function criarEncontro(minicursoId: string, dataISO: string, tituloBruto: string): Promise<Resultado> {
  try {
    await exigirTurma(minicursoId)
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const data = lerDataISO(dataISO)
  if (!data) return { ok: false, erro: 'data inválida' }
  const titulo = tituloBruto.trim()
  if (titulo.length > 80) return { ok: false, erro: 'o título do encontro passa de 80 letras' }

  if ((await db.encontro.count({ where: { minicursoId } })) >= MAX_ENCONTROS) {
    return { ok: false, erro: `limite de ${MAX_ENCONTROS} encontros por minicurso` }
  }

  await db.encontro.create({ data: { minicursoId, data, titulo: titulo || null } })
  revalidatePath('/admin/presenca', 'layout')
  return { ok: true, mensagem: 'Encontro criado.' }
}

export async function apagarEncontro(encontroId: string): Promise<Resultado> {
  let minicursoId: string
  try {
    minicursoId = await exigirEncontro(encontroId)
  } catch (err) {
    return { ok: false, erro: (err as Error).message }
  }

  await db.encontro.delete({ where: { id: encontroId } })
  revalidatePath('/admin/presenca', 'layout')
  return { ok: true, mensagem: 'Encontro apagado.' }
}

export async function marcarPresenca(encontroId: string, inscricaoId: string, presente: boolean): Promise<Resultado> {
  let minicursoId: string
  try {
    minicursoId = await exigirEncontro(encontroId)
  } catch (err) {
    return { ok: false, erro: (err as Error).message }
  }

  // a inscrição tem que ser da mesma turma do encontro: sem isso, um id
  // trocado marcaria presença de aluno de outro minicurso
  const insc = await db.inscricao.findFirst({ where: { id: inscricaoId, minicursoId }, select: { id: true } })
  if (!insc) return { ok: false, erro: 'esta pessoa não está inscrita neste minicurso' }

  if (presente) {
    await db.presenca.createMany({ data: [{ encontroId, inscricaoId }], skipDuplicates: true })
  } else {
    await db.presenca.deleteMany({ where: { encontroId, inscricaoId } })
  }
  revalidatePath('/admin/presenca', 'layout')
  return { ok: true, mensagem: '' }
}

/** Marca (ou desmarca) todo mundo de uma vez, pra o caso comum de "foi todo mundo". */
export async function marcarTodos(encontroId: string, presente: boolean): Promise<Resultado> {
  let minicursoId: string
  try {
    minicursoId = await exigirEncontro(encontroId)
  } catch (err) {
    return { ok: false, erro: (err as Error).message }
  }

  if (presente) {
    const inscricoes = await db.inscricao.findMany({ where: { minicursoId }, select: { id: true } })
    await db.presenca.createMany({ data: inscricoes.map((i) => ({ encontroId, inscricaoId: i.id })), skipDuplicates: true })
  } else {
    await db.presenca.deleteMany({ where: { encontroId } })
  }
  revalidatePath('/admin/presenca', 'layout')
  return { ok: true, mensagem: presente ? 'Todos marcados como presentes.' : 'Presenças desmarcadas.' }
}
