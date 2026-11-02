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

  // Aluno tem conta no site, mas painel é só de quem é do grupo.
  if (u.papel === 'ALUNO') redirect('/aluno')

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

export type AlunoLogado = { id: string; nome: string; email: string; matricula: string | null }

/**
 * Aluno com sessão válida E matrícula ativa, ou null. Confere o banco a
 * cada chamada (não confia só na sessão): remover/desativar o aluno corta
 * o acesso na hora, mesmo com o cookie ainda de pé. Serve pra route
 * handlers e actions, que respondem erro em vez de redirecionar.
 */
export async function alunoDaSessao(): Promise<AlunoLogado | null> {
  const sessao = await auth()
  if (!sessao?.user?.id) return null

  const u = await db.user.findUnique({ where: { id: sessao.user.id }, select: { email: true, ativo: true } })
  if (!u || !u.ativo) return null

  const aluno = await db.aluno.findUnique({
    where: { email: u.email },
    select: { id: true, nome: true, email: true, matricula: true, ativo: true },
  })
  if (!aluno || !aluno.ativo) return null

  return { id: aluno.id, nome: aluno.nome, email: aluno.email, matricula: aluno.matricula }
}

/** Para páginas da área do aluno: manda pro login e depois traz de volta. */
export async function exigirAluno(de = '/aluno'): Promise<AlunoLogado> {
  const sessao = await auth()
  if (!sessao?.user?.id) redirect(`/entrar?de=${encodeURIComponent(de)}`)

  const aluno = await alunoDaSessao()
  if (!aluno) redirect('/entrar?erro=nao-convidado')
  return aluno
}

/**
 * Pode abrir conteúdo de área restrita (hoje: apresentações de páginas de
 * minicurso)? Equipe do painel sim; aluno só com matrícula ativa em algum
 * minicurso ativo. Não olha qual minicurso: o endereço de uma apresentação
 * só aparece dentro de páginas que o aluno já passou pelo portão de
 * matrícula, e é um id impossível de adivinhar.
 */
export async function podeVerConteudoRestrito(): Promise<boolean> {
  const sessao = await auth()
  if (!sessao?.user?.id) return false

  const u = await db.user.findUnique({ where: { id: sessao.user.id }, select: { email: true, papel: true, ativo: true } })
  if (!u || !u.ativo) return false
  if (u.papel === 'ADMIN' || u.papel === 'EDITOR') return true

  const n = await db.inscricao.count({ where: { aluno: { email: u.email, ativo: true }, minicurso: { ativo: true } } })
  return n > 0
}
