import { z } from 'zod'
import { corSchema } from './cores'
import { elementoSchema } from './elementos'

/**
 * Uma página é uma lista ordenada de blocos.
 *
 * O bloco de trabalho é a FAIXA: fundo + decoração + N quadrantes.
 * As bandas do Connect e do Processo seletivo são a mesma Faixa com
 * parâmetros diferentes — foi essa constatação que definiu o modelo.
 */

/** Quantos quadrantes cada layout comporta. */
export const LAYOUTS = {
  '1': 1,
  '2': 2,
  '2-60/40': 2,
  '3': 3,
  '2x2': 4,
} as const

export type Layout = keyof typeof LAYOUTS

export const TAMANHOS_RAIO = { pequeno: 140, medio: 220, gigante: 340 } as const
export type TamanhoRaio = keyof typeof TAMANHOS_RAIO

export const decorSchema = z.object({
  tipo: z.literal('raio'),
  cor: corSchema,
  lado: z.enum(['esquerda', 'direita']),
  tamanho: z.enum(['pequeno', 'medio', 'gigante']).default('medio'),
  /** o raio corta na borda da faixa em vez de caber inteiro dentro */
  sangra: z.boolean().default(false),
  opacidade: z.number().min(0).max(1).default(0.9),
})

export type Decor = z.infer<typeof decorSchema>

const faixaBase = z.object({
  id: z.string().uuid(),
  tipo: z.literal('faixa'),
  fundo: corSchema,
  /** cor dos destaques (títulos de lista, botão sólido) */
  acento: corSchema.optional(),
  layout: z.enum(['1', '2', '2-60/40', '3', '2x2']),
  alinhamento: z.enum(['start', 'center']).default('start'),
  espacamento: z.enum(['compacto', 'normal', 'amplo']).default('normal'),
  decor: decorSchema.nullable().default(null),
  quadrantes: z.array(z.array(elementoSchema)).min(1).max(4),
})

/**
 * O número de quadrantes tem que bater com o layout. Sem isso é possível
 * salvar uma faixa "3 colunas" com 1 quadrante e a página renderiza
 * torta — o tipo de estado inválido que não deve chegar no banco.
 */
export const faixaSchema = faixaBase.superRefine((f, ctx) => {
  const esperado = LAYOUTS[f.layout]
  if (f.quadrantes.length !== esperado) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['quadrantes'],
      message: `o layout "${f.layout}" tem ${esperado} quadrante(s), mas vieram ${f.quadrantes.length}`,
    })
  }
})

/** Topo da home: manchete + botões + fotos. Só existe uma por site. */
export const heroSchema = z.object({
  id: z.string().uuid(),
  tipo: z.literal('hero'),
  chapeu: z.string().max(120),
  titulo: z.string().min(1).max(120),
  texto: z.string().max(400),
  botoes: z.array(z.object({
    texto: z.string().min(1).max(40),
    href: z.string().min(1),
    variante: z.enum(['solido', 'contorno']).default('solido'),
  })).max(2),
  fotos: z.array(z.object({
    midiaId: z.string().cuid().nullable(),
    legenda: z.string().max(120).optional(),
  })).max(3),
})

/** Cabeçalho das páginas internas — a tarja com migalha e título. */
export const cabecalhoSchema = z.object({
  id: z.string().uuid(),
  tipo: z.literal('cabecalho'),
  migalha: z.string().max(80), // "Pesquisa / Projetos internos"
  titulo: z.string().min(1).max(120),
  texto: z.string().max(400).optional(),
  fundo: corSchema.default('amarelo'),
  decor: decorSchema.nullable().default(null),
})

/**
 * Grid da equipe. Sai do banco de pessoas, não de conteúdo digitado —
 * senão toda gestão redigita os 12 membros.
 */
export const equipeSchema = z.object({
  id: z.string().uuid(),
  tipo: z.literal('equipe'),
  titulo: z.string().max(80).optional(),
  mostrarTutor: z.boolean().default(true),
  limite: z.number().int().min(1).max(40).nullable().default(null),
})

/** Mapa do site — gerado da árvore de páginas, sem conteúdo próprio. */
export const mapaSchema = z.object({
  id: z.string().uuid(),
  tipo: z.literal('mapa'),
})

export const blocoSchema = z.discriminatedUnion('tipo', [
  faixaBase, // discriminatedUnion exige ZodObject; a checagem de quadrantes vem abaixo
  heroSchema,
  cabecalhoSchema,
  equipeSchema,
  mapaSchema,
])

export type Bloco = z.infer<typeof blocoSchema>
export type Faixa = z.infer<typeof faixaBase>
export type TipoBloco = Bloco['tipo']

/** O que é salvo na coluna `blocos` / `rascunho` de Pagina. */
export const blocosSchema = z
  .array(blocoSchema)
  .max(40)
  .superRefine((blocos, ctx) => {
    blocos.forEach((b, i) => {
      if (b.tipo !== 'faixa') return
      const esperado = LAYOUTS[b.layout]
      if (b.quadrantes.length !== esperado) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'quadrantes'],
          message: `o layout "${b.layout}" tem ${esperado} quadrante(s), mas vieram ${b.quadrantes.length}`,
        })
      }
    })

    const ids = blocos.map((b) => b.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'há blocos com o mesmo id — reordenar depende de id único',
      })
    }
  })

export type Blocos = z.infer<typeof blocosSchema>

/**
 * O conteúdo tem que desviar do raio, senão o texto colide com a
 * decoração em tela estreita. Como o raio é parâmetro livre do editor,
 * alguém vai escolher a combinação que quebra — então a regra fica aqui,
 * não na mão de quem edita.
 */
export function recuoDoRaio(decor: Decor | null): { lado: 'left' | 'right'; px: number } | null {
  if (!decor) return null
  return {
    lado: decor.lado === 'direita' ? 'right' : 'left',
    px: Math.round(TAMANHOS_RAIO[decor.tamanho] * 0.62),
  }
}
