import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { pode, type Acao, type Papel } from './acesso'

export type Usuario = { id: string; nome: string | null; email: string; imagem: string | null; papel: Papel }

/** Sessão + papel vindo do banco. Redireciona se não houver acesso válido. */
export async function exigirUsuario(): Promise<Usuario> {
  const sessao = await auth()
  if (!sessao?.user?.id) redirect('/entrar')

  const u = await db.user.findUnique({
    where: { id: sessao.user.id },
    select: { id: true, nome: true, email: true, imagem: true, papel: true, ativo: true },
  })

  // O acesso pode ter sido revogado depois que a sessão foi criada.
  if (!u || !u.ativo) redirect('/entrar?erro=desativado')

  return { id: u.id, nome: u.nome, email: u.email, imagem: u.imagem, papel: u.papel }
}

export async function exigirPermissao(acao: Acao): Promise<Usuario> {
  const u = await exigirUsuario()
  if (!pode(u.papel, acao)) redirect('/admin?erro=sem-permissao')
  return u
}

/** Para server actions: lança em vez de redirecionar. */
export async function exigirPermissaoAction(acao: Acao): Promise<Usuario> {
  const sessao = await auth()
  if (!sessao?.user?.id) throw new Error('não autenticado')

  const u = await db.user.findUnique({
    where: { id: sessao.user.id },
    select: { id: true, nome: true, email: true, imagem: true, papel: true, ativo: true },
  })
  if (!u || !u.ativo) throw new Error('acesso revogado')
  if (!pode(u.papel, acao)) throw new Error(`sem permissão para ${acao}`)

  return { id: u.id, nome: u.nome, email: u.email, imagem: u.imagem, papel: u.papel }
}
