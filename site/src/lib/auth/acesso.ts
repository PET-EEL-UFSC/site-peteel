import { z } from 'zod'

/**
 * Login é Google sem restrição de domínio — o grupo usa Gmail pessoal.
 * A consequência é que autenticar no Google NÃO é autorização: qualquer
 * pessoa do planeta consegue. Quem decide é a tabela User.
 *
 * Regra: só entra quem já tem linha em User e está ativo. Admin cria a
 * linha (convite por e-mail) antes da pessoa conseguir o primeiro login.
 */

/**
 * ALUNO é o papel de quem só usa a área do aluno. Ele NUNCA passa por
 * `pode()` (as ações de painel só listam ADMIN/EDITOR) e `exigirUsuario`
 * o expulsa do /admin: ter conta no site não é ter acesso ao painel.
 */
export type Papel = 'ADMIN' | 'EDITOR' | 'ALUNO'

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

export type DecisaoEntrada =
  | { permitido: true; papel: Papel; userId: string | null } // null: User ainda não existe (primeiro login de aluno)
  | { permitido: false; motivo: 'nao-convidado' | 'desativado' }

/**
 * Quem entra: convidado do painel (User ativo) ou aluno com matrícula ativa.
 * Aluno tem dois portões: a conta existir e a linha de Aluno continuar
 * ativa. Remover a matrícula derruba o acesso mesmo com User e sessão
 * antigos de pé.
 */
export function decidirEntrada(usuario: Convidado | null, aluno: { ativo: boolean } | null): DecisaoEntrada {
  if (usuario) {
    if (!usuario.ativo) return { permitido: false, motivo: 'desativado' }
    if (usuario.papel === 'ALUNO' && !aluno?.ativo) {
      return { permitido: false, motivo: aluno ? 'desativado' : 'nao-convidado' }
    }
    return { permitido: true, papel: usuario.papel, userId: usuario.id }
  }
  if (!aluno) return { permitido: false, motivo: 'nao-convidado' }
  if (!aluno.ativo) return { permitido: false, motivo: 'desativado' }
  return { permitido: true, papel: 'ALUNO', userId: null }
}

/**
 * O destino pós-login vem da URL (?de=), ou seja, de quem montou o link.
 * Aceitar qualquer valor deixa um link do nosso domínio mandar a pessoa
 * pra um site de terceiros logo depois de logar (phishing). Só passa
 * caminho relativo do próprio site.
 */
export function caminhoSeguro(de: string | null | undefined, padrao: string): string {
  if (!de || de.length > 200) return padrao
  if (!de.startsWith('/') || de.startsWith('//')) return padrao
  if (/[\\\u0000-\u001f]/.test(de)) return padrao
  return de
}

/** Primeiros segmentos que pertencem a rotas do sistema: página pública não pode ocupá-los. */
const SEGMENTOS_RESERVADOS = ['aluno', 'admin', 'api', 'entrar', 'previa', 'apresentacao', 'marca', 'uploads']

export function slugReservado(slug: string): boolean {
  const primeiro = slug.replace(/^\//, '').split('/')[0]
  return SEGMENTOS_RESERVADOS.includes(primeiro)
}

/**
 * Mensagens da tela de login. Cobre tanto os motivos nossos quanto os
 * códigos que o Auth.js devolve — sem isso qualquer falha de
 * configuração vira "tente de novo", que não diz nada a quem está
 * montando o site nem a quem só quer entrar.
 */
export const MENSAGENS: Record<string, { texto: string; tecnico?: string }> = {
  // nossos
  'nao-convidado': {
    texto:
      'Esta conta Google não está cadastrada. Se você é aluno de minicurso, entre com o mesmo e-mail que usou na inscrição; se é do grupo, peça a um administrador para te adicionar.',
  },
  'email-nao-verificado': {
    texto: 'O Google não confirmou o e-mail desta conta. Use outra conta ou verifique o e-mail no Google.',
  },
  desativado: {
    texto: 'Este acesso foi desativado. Fale com um administrador do grupo.',
  },

  // do Auth.js
  Configuration: {
    texto: 'O login com Google ainda não está configurado neste site.',
    tecnico:
      'Faltam AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET, ou foram adicionadas sem reimplantar. Variável nova só vale no próximo build.',
  },
  AccessDenied: {
    texto: 'Acesso negado. Esta conta não está na lista de quem pode entrar.',
  },
  Verification: {
    texto: 'Este link de acesso expirou. Tente entrar de novo.',
  },
  OAuthAccountNotLinked: {
    texto: 'Já existe um acesso com este e-mail, criado por outro método.',
    tecnico: 'Auth.js recusou vincular a conta Google a um usuário existente.',
  },
  OAuthSignin: {
    texto: 'Não foi possível iniciar o login com o Google.',
    tecnico: 'Confira o AUTH_GOOGLE_ID e se o cliente OAuth existe no projeto do Google Cloud.',
  },
  OAuthCallback: {
    texto: 'O Google recusou a volta para o site.',
    tecnico:
      'O endereço de redirecionamento tem que ser exatamente <NEXTAUTH_URL>/api/auth/callback/google no Google Cloud.',
  },
  Callback: {
    texto: 'Algo deu errado ao concluir o login.',
  },
}

export function mensagemDeErro(codigo: string | undefined): { texto: string; tecnico?: string } | null {
  if (!codigo) return null
  return (
    MENSAGENS[codigo] ?? {
      texto: 'Não foi possível entrar.',
      tecnico: `Código devolvido: ${codigo}`,
    }
  )
}

/**
 * A divisão é entre trabalho do dia a dia e governança, não entre
 * "confiável" e "não confiável".
 *
 * EDITOR faz tudo que é conteúdo, publicar inclusive. Prender a
 * publicação no ADMIN só faria o grupo compartilhar a senha da conta
 * institucional — e uma senha circulando entre doze pessoas é pior do
 * que cada uma ter seu próprio acesso. O histórico de revisões cobre o
 * risco: nada some, e o ADMIN restaura.
 *
 * ADMIN guarda o que é irreversível ou estrutural: apagar página,
 * gerenciar quem entra, configurar o site.
 */
export const PERMISSOES = {
  editarRascunho: ['ADMIN', 'EDITOR'],
  publicar: ['ADMIN', 'EDITOR'],
  subirMidia: ['ADMIN', 'EDITOR'],
  criarPagina: ['ADMIN', 'EDITOR'],

  // inscrições de minicurso guardam e-mail/matrícula de alunos. Mesma regra
  // dos petianos (quem organiza o minicurso precisa operar sem depender do
  // admin); pra restringir só aos admins, troque a lista abaixo.
  gerenciarMinicursos: ['ADMIN', 'EDITOR'],

  // a lista de petianos é conteúdo do site: quem entra no grupo em março
  // precisa aparecer na página sem depender do admin
  gerenciarPetianos: ['ADMIN', 'EDITOR'],

  apagarPagina: ['ADMIN'],
  apagarMinicurso: ['ADMIN'], // leva junto as inscrições e os alunos que só estavam nele
  gerenciarAcessos: ['ADMIN'],
  configurarSite: ['ADMIN'],
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
