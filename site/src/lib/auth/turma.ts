import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirPermissao } from './sessao'
import type { Usuario } from './sessao'

/**
 * Portão das páginas de presença: precisa da permissão geral E de ser
 * ministrante do minicurso (administrador vale pra qualquer um). Quem não
 * passa vê 404, igual ao de minicurso que não existe: não confirma quais
 * turmas existem. É o mesmo critério das ações (acoes-presenca.ts).
 */
export async function exigirAcessoATurma(minicursoId: string): Promise<Usuario> {
  const u = await exigirPermissao('registrarPresenca')
  if (u.papel === 'ADMIN') return u

  const vinculo = await db.minicursoMinistrante.findUnique({
    where: { minicursoId_userId: { minicursoId, userId: u.id } },
    select: { userId: true },
  })
  if (!vinculo) notFound()
  return u
}
