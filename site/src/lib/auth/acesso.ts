import { z } from 'zod'

/**
 * Login é Google sem restrição de domínio — o grupo usa Gmail pessoal.
 * A consequência é que autenticar no Google NÃO é autorização: qualquer
 * pessoa do planeta consegue. Quem decide é a tabela User.
 *
 * Regra: só entra quem já tem linha em User e está ativo. Admin cria a
 * linha (convite por e-mail) antes da pessoa conseguir o primeiro login.
 */

export type Papel = 'ADMIN' | 'EDITOR'

export type Convidado = {
  id: string
  email: string
  papel: Papel
  ativo: boolean
  primeiroAcesso: Date | null
}

export const emailSchema = z.string().trim().toLowerCase().email()

export type ResultadoAcesso =
  | { permitido: true; userId: string; papel: Papel }
  | { permitido: false; motivo: 'nao-convidado' | 'desativado' }

export function avaliarAcesso(convidado: Convidado | null): ResultadoAcesso {
  if (!convidado) return { permitido: false, motivo: 'nao-convidado' }
  if (!convidado.ativo) return { permitido: false, motivo: 'desativado' }
  return { permitido: true, userId: convidado.id, papel: convidado.papel }
}

export const MENSAGENS: Record<'nao-convidado' | 'desativado', string> = {
  'nao-convidado':
    'Esta conta não tem acesso ao painel do PET EEL. Peça a um administrador do grupo para te adicionar.',
  desativado: 'Este acesso foi desativado. Fale com um administrador do grupo.',
}

/** Só ADMIN publica e mexe em pessoas; EDITOR salva rascunho. */
export const PERMISSOES = {
  editarRascunho: ['ADMIN', 'EDITOR'],
  publicar: ['ADMIN'],
  gerenciarPessoas: ['ADMIN'],
  criarPagina: ['ADMIN'],
  apagarPagina: ['ADMIN'],
  subirMidia: ['ADMIN', 'EDITOR'],
} as const satisfies Record<string, readonly Papel[]>

export type Acao = keyof typeof PERMISSOES

export function pode(papel: Papel, acao: Acao): boolean {
  return (PERMISSOES[acao] as readonly Papel[]).includes(papel)
}

/**
 * Bootstrap: o primeiro admin não pode ser convidado por ninguém.
 * Vem de ADMIN_INICIAL no ambiente e é criado pelo seed. Depois disso a
 * variável pode sair do ambiente — admin convida admin pela interface.
 */
export function adminInicial(env: NodeJS.ProcessEnv = process.env): string | null {
  const raw = env.ADMIN_INICIAL
  if (!raw) return null
  const r = emailSchema.safeParse(raw)
  return r.success ? r.data : null
}
