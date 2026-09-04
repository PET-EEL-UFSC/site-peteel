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

export const corSolidaSchema = z.union([
  z.enum(Object.keys(PALETA) as [NomeCor, ...NomeCor[]]),
  z.string().regex(/^#[0-9a-fA-F]{6}$/, 'use um hex de 6 dígitos, ex: #FDEA00'),
])

export type CorSolida = z.infer<typeof corSolidaSchema>

/**
 * Gradiente linear entre duas cores sólidas. Existe porque a identidade
 * de algumas frentes (ex.: a VMC) já nasce em degradê — sem isso, cada
 * página assim vira remendo de hex solto fora da paleta.
 */
export const gradienteSchema = z.object({
  tipo: z.literal('gradiente'),
  de: corSolidaSchema,
  para: corSolidaSchema,
  angulo: z.number().min(0).max(360).default(135),
})

export type Gradiente = z.infer<typeof gradienteSchema>

export const corSchema = z.union([corSolidaSchema, gradienteSchema])

export type Cor = z.infer<typeof corSchema>

export function ehGradiente(cor: Cor): cor is Gradiente {
  return typeof cor === 'object'
}

/** Cor sólida representativa — usada onde CSS não aceita gradiente (borda, texto). */
export function hexDe(cor: Cor): string {
  if (ehGradiente(cor)) return hexDe(cor.de)
  return cor in PALETA ? PALETA[cor as NomeCor] : cor
}

/** Valor pronto pra propriedade CSS `background`: hex sólido ou `linear-gradient(...)`. */
export function fundoDe(cor: Cor): string {
  if (ehGradiente(cor)) return `linear-gradient(${cor.angulo}deg, ${hexDe(cor.de)}, ${hexDe(cor.para)})`
  return hexDe(cor)
}

function luminancia(hex: string): number {
  const h = hex.slice(1)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * A cor do texto NÃO é escolhida pelo editor: deriva do fundo. Sem isso
 * alguém acaba publicando texto amarelo sobre fundo amarelo. Num
 * gradiente, usa a média das duas pontas — não existe uma luminância só.
 */
export function fundoEscuro(cor: Cor): boolean {
  if (ehGradiente(cor)) {
    const media = (luminancia(hexDe(cor.de)) + luminancia(hexDe(cor.para))) / 2
    return media < 140
  }
  return luminancia(hexDe(cor)) < 140
}

export function textoSobre(fundo: Cor): '#F9F9F9' | '#2C2B22' {
  return fundoEscuro(fundo) ? '#F9F9F9' : '#2C2B22'
}
