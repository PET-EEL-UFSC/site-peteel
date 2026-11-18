import { emailSchema } from '@/lib/auth/acesso'

export type PedidoDeInscricao = { nome: string; email: string; matricula: string | null }

export type ResultadoPedido =
  | { ok: true; pedido: PedidoDeInscricao }
  | { ok: false; erro: string }
  /** parece robô: responde como se tivesse dado certo, sem guardar nada e sem dar pista do motivo */
  | { ok: 'descartar' }

/** Quem preenche de verdade leva mais que isso entre abrir o formulário e enviar. */
const TEMPO_MINIMO_MS = 1500

/**
 * Valida o que veio do formulário público. É a única entrada de dado
 * sem login do sistema, então desconfia de tudo: o campo `empresa` é uma
 * armadilha (escondido, humano nunca preenche) e o envio rápido demais
 * também denuncia robô.
 */
export function validarPedidoDeInscricao(c: {
  nome: unknown
  email: unknown
  matricula: unknown
  empresa: unknown
  tempoMs: unknown
}): ResultadoPedido {
  if (typeof c.empresa === 'string' && c.empresa.trim() !== '') return { ok: 'descartar' }
  const tempo = Number(c.tempoMs)
  if (!Number.isFinite(tempo) || tempo < TEMPO_MINIMO_MS) return { ok: 'descartar' }

  const nome = typeof c.nome === 'string' ? c.nome.replace(/\s+/g, ' ').trim() : ''
  if (nome.length < 2 || nome.length > 80) return { ok: false, erro: 'Informe seu nome completo (de 2 a 80 letras).' }
  // spam típico de formulário aberto: link no lugar do nome
  if (/https?:|www\.|@/i.test(nome)) return { ok: false, erro: 'O nome não pode ter links nem e-mails.' }

  const email = emailSchema.safeParse(typeof c.email === 'string' ? c.email : '')
  if (!email.success || email.data.length > 120) return { ok: false, erro: 'Confira o e-mail digitado.' }

  let matricula: string | null = null
  if (typeof c.matricula === 'string' && c.matricula.trim() !== '') {
    const m = c.matricula.trim()
    if (!/^[A-Za-z0-9.-]{3,20}$/.test(m)) return { ok: false, erro: 'Confira a matrícula (só letras, números, ponto e hífen).' }
    matricula = m
  }

  return { ok: true, pedido: { nome, email: email.data, matricula } }
}

export const JANELA_PEDIDOS_MIN = 10
export const MAX_PEDIDOS_NA_JANELA = 40
export const MAX_PEDIDOS_PENDENTES = 1000
