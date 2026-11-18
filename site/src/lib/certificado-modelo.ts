import { z } from 'zod'

/**
 * Modelo de certificado: uma imagem de fundo (A4 paisagem) e uma lista de
 * caixas de texto. Cada caixa tem posição e largura em % da página (assim o
 * modelo não depende do tamanho da imagem), tamanho em pontos e cor.
 */

export const PAGINA = { largura: 841.89, altura: 595.28 } as const // A4 paisagem, em pontos

export const caixaSchema = z.object({
  /** pode ter campos como {nome}, {minicurso}, {carga}, {horas} e {data}, e trechos opcionais entre [[ ]] */
  texto: z.string().max(600),
  /** borda esquerda da caixa, em % da largura da página */
  x: z.number().min(0).max(100),
  /** topo da caixa, em % da altura da página (contado de cima pra baixo) */
  y: z.number().min(0).max(100),
  /** largura da caixa, em % da largura da página */
  largura: z.number().min(5).max(100),
  /** tamanho da letra, em pontos */
  tamanho: z.number().min(6).max(120),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fonte: z.enum(['sans', 'serif']),
  negrito: z.boolean(),
  alinhamento: z.enum(['esquerda', 'centro', 'direita']),
  /** uma linha só: a letra diminui até caber na largura (bom pra nomes compridos) */
  encolher: z.boolean(),
})

export const caixasSchema = z.array(caixaSchema).max(12)
export type Caixa = z.infer<typeof caixaSchema>

export const CAMPOS = [
  ['{nome}', 'nome do aluno'],
  ['{minicurso}', 'nome do minicurso'],
  ['{carga}', 'carga horária com a unidade (ex.: 12 horas)'],
  ['{horas}', 'só o número da carga horária (ex.: 12)'],
  ['{data}', 'data de emissão (ex.: 16 de novembro de 2026)'],
] as const

/** Ponto de partida de um modelo novo: o texto de sempre, centralizado, pra ajustar sobre a sua arte. */
export const CAIXAS_PADRAO: Caixa[] = [
  { texto: 'CERTIFICADO', x: 10, y: 14, largura: 80, tamanho: 44, cor: '#2C2B22', fonte: 'sans', negrito: true, alinhamento: 'centro', encolher: false },
  { texto: 'Certificamos que', x: 10, y: 33, largura: 80, tamanho: 16, cor: '#555555', fonte: 'sans', negrito: false, alinhamento: 'centro', encolher: false },
  { texto: '{nome}', x: 10, y: 40, largura: 80, tamanho: 34, cor: '#2C2B22', fonte: 'sans', negrito: true, alinhamento: 'centro', encolher: true },
  {
    texto: 'participou do minicurso {minicurso}[[, com carga horária de {carga}]].',
    x: 15, y: 55, largura: 70, tamanho: 18, cor: '#2C2B22', fonte: 'sans', negrito: false, alinhamento: 'centro', encolher: false,
  },
  { texto: 'Emitido em {data}', x: 10, y: 84, largura: 80, tamanho: 12, cor: '#555555', fonte: 'sans', negrito: false, alinhamento: 'centro', encolher: false },
]

export type DadosTexto = { nome: string; minicurso: string; cargaHoraria: number | null; data: Date }

export function dataPorExtenso(d: Date): string {
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Troca os campos pelo valor real. Um trecho entre [[ ]] some inteiro se
 * algum campo dentro dele estiver vazio: "[[, com carga horária de {carga}]]"
 * não deixa "carga horária de ." no certificado de um minicurso sem carga.
 */
export function resolverTexto(modelo: string, d: DadosTexto): string {
  const valores: Record<string, string> = {
    nome: d.nome,
    minicurso: d.minicurso,
    horas: d.cargaHoraria ? String(d.cargaHoraria) : '',
    carga: d.cargaHoraria ? `${d.cargaHoraria} ${d.cargaHoraria === 1 ? 'hora' : 'horas'}` : '',
    data: dataPorExtenso(d.data),
  }
  const campo = /\{(nome|minicurso|carga|horas|data)\}/g

  const comOpcionais = modelo.replace(/\[\[([\s\S]*?)\]\]/g, (_, dentro: string) => {
    const faltou = [...dentro.matchAll(campo)].some((m) => !valores[m[1]])
    return faltou ? '' : dentro
  })
  return comOpcionais.replace(campo, (_, nome: string) => valores[nome])
}

/** A4 paisagem tem proporção ~1,414. Imagem muito diferente sai esticada no PDF. */
export function proporcaoDoFundoOk(largura: number, altura: number): boolean {
  if (!largura || !altura) return false
  const alvo = PAGINA.largura / PAGINA.altura
  return Math.abs(largura / altura - alvo) / alvo <= 0.03
}
