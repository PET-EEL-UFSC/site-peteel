import { z } from 'zod'

/**
 * Paleta da marca. O editor escolhe por nome, não por hex — é o que
 * mantém a identidade de pé entre gestões. Hex livre existe, mas fica
 * atrás de um clique a mais na interface.
 */
export const PALETA = {
  amarelo: '#FDEA00',
  escuro: '#2C2B22',
  offwhite: '#F9F9F9',
  azul: '#0000F6',
  laranja: '#FDA000',
  branco: '#FFFFFF',
} as const

export type NomeCor = keyof typeof PALETA

export const corSchema = z.union([
  z.enum(Object.keys(PALETA) as [NomeCor, ...NomeCor[]]),
  z.string().regex(/^#[0-9a-fA-F]{6}$/, 'use um hex de 6 dígitos, ex: #FDEA00'),
])

export type Cor = z.infer<typeof corSchema>

export function hexDe(cor: Cor): string {
  return cor in PALETA ? PALETA[cor as NomeCor] : cor
}

/**
 * A cor do texto NÃO é escolhida pelo editor: deriva do fundo. Sem isso
 * alguém acaba publicando texto amarelo sobre fundo amarelo.
 */
export function fundoEscuro(cor: Cor): boolean {
  const h = hexDe(cor).slice(1)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b < 140
}

export function textoSobre(fundo: Cor): '#F9F9F9' | '#2C2B22' {
  return fundoEscuro(fundo) ? '#F9F9F9' : '#2C2B22'
}
