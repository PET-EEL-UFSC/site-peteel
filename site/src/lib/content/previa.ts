/**
 * Protocolo entre o editor e o iframe da prévia.
 *
 * Os dois lados conferem a origem da mensagem: o iframe é same-origin, e
 * sem essa checagem qualquer página aberta em outra aba poderia injetar
 * conteúdo na prévia.
 */
export type MsgParaPrevia =
  | { tipo: 'blocos'; blocos: unknown }
  | { tipo: 'selecionar'; id: string }

export type MsgDaPrevia = { tipo: 'pronta' }

export const CANAL = 'peteel-previa'
