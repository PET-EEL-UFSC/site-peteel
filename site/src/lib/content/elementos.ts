import { z } from 'zod'
import { corSchema } from './cores'

/**
 * Elementos são as peças que entram num quadrante de uma Faixa.
 * Todo elemento é um objeto com `tipo` — união discriminada, então o
 * editor e o renderizador ficam exaustivos por construção.
 */

export const PROPORCOES = ['1/1', '4/3', '3/2', '16/10', '4/5'] as const
export const proporcaoSchema = z.enum(PROPORCOES)

/** Referência a uma linha de Midia. Null = slot vazio (foto ainda não subiu). */
export const fotoRefSchema = z.object({
  midiaId: z.string().cuid().nullable(),
  legenda: z.string().max(120).optional(),
})

export const chipSchema = z.object({
  tipo: z.literal('chip'),
  texto: z.string().min(1).max(60),
  cor: corSchema.optional(),
  estilo: z.enum(['solido', 'contorno']).default('solido'),
  inclinado: z.boolean().default(false),
})

export const tituloSchema = z.object({
  tipo: z.literal('titulo'),
  texto: z.string().min(1).max(120),
  tamanho: z.enum(['p', 'm', 'g']).default('g'),
})

export const paragrafoSchema = z.object({
  tipo: z.literal('paragrafo'),
  texto: z.string().min(1).max(800),
})

export const botaoSchema = z.object({
  texto: z.string().min(1).max(40),
  href: z.string().min(1),
  variante: z.enum(['solido', 'contorno']).default('solido'),
})

export const botoesSchema = z.object({
  tipo: z.literal('botoes'),
  // mais de 3 botões lado a lado quebra o layout e não é decisão de conteúdo
  itens: z.array(botaoSchema).min(1).max(3),
})

export const listaSchema = z.object({
  tipo: z.literal('lista'),
  itens: z
    .array(
      z.object({
        titulo: z.string().min(1).max(60),
        texto: z.string().min(1).max(300),
      })
    )
    .min(1)
    .max(8),
})

export const fotoSchema = z.object({
  tipo: z.literal('foto'),
  foto: fotoRefSchema,
  proporcao: proporcaoSchema.default('4/3'),
})

export const galeriaSchema = z.object({
  tipo: z.literal('galeria'),
  itens: z.array(fotoRefSchema).min(1).max(12),
  colunas: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
  proporcao: proporcaoSchema.default('1/1'),
  /** primeiro item ocupa 2x2 no grid, como o mosaico da home */
  destaque: z.boolean().default(false),
})

export const cardsSchema = z.object({
  tipo: z.literal('cards'),
  itens: z
    .array(
      z.object({
        titulo: z.string().min(1).max(80),
        texto: z.string().max(400).optional(),
        tag: z.string().max(30).optional(),
        corTag: corSchema.optional(),
        foto: fotoRefSchema.optional(),
        href: z.string().optional(),
      })
    )
    .min(1)
    .max(12),
  colunas: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
})

/** Linhas com miniatura — agendas, cursos, episódios, egressos. */
export const linhasSchema = z.object({
  tipo: z.literal('linhas'),
  itens: z
    .array(
      z.object({
        rotulo: z.string().max(40), // "Sex · 12h10", "Ep. 03"
        titulo: z.string().min(1).max(80),
        texto: z.string().max(400).optional(),
        foto: fotoRefSchema.optional(),
        href: z.string().optional(),
      })
    )
    .min(1)
    .max(30),
  comFoto: z.boolean().default(true),
})

/** Vídeo do YouTube ou player do Spotify. */
export const embedSchema = z.object({
  tipo: z.literal('embed'),
  provedor: z.enum(['youtube', 'spotify']),
  url: z.string().url(),
  titulo: z.string().max(120).optional(),
})

export const elementoSchema = z.discriminatedUnion('tipo', [
  chipSchema,
  tituloSchema,
  paragrafoSchema,
  botoesSchema,
  listaSchema,
  fotoSchema,
  galeriaSchema,
  cardsSchema,
  linhasSchema,
  embedSchema,
])

export type Elemento = z.infer<typeof elementoSchema>
export type TipoElemento = Elemento['tipo']
export type FotoRef = z.infer<typeof fotoRefSchema>
