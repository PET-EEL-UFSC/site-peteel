import { db } from '@/lib/db'
import { blocosSchema, type Blocos } from './blocos'
import { coletarMidiaIds, type MapaMidia } from './midia'
import type { DadosPagina } from '@/components/blocos'
import type { NoArvore } from '@/components/blocos/Mapa'

/**
 * O que está no banco é Json — pode ter sido escrito por uma versão
 * anterior do schema. Parseia tolerante: bloco inválido é descartado com
 * aviso em vez de derrubar a página inteira no ar.
 */
export function lerBlocos(raw: unknown, ondeParaLog: string): Blocos {
  const r = blocosSchema.safeParse(raw)
  if (r.success) return r.data

  if (!Array.isArray(raw)) {
    console.error(`[blocos] ${ondeParaLog}: conteúdo não é uma lista, renderizando vazio`)
    return []
  }

  const validos: Blocos = []
  for (const item of raw) {
    const um = blocosSchema.safeParse([item])
    if (um.success) validos.push(...um.data)
    else console.error(`[blocos] ${ondeParaLog}: bloco descartado —`, um.error.issues[0]?.message)
  }
  return validos
}

export async function carregarArvore(): Promise<NoArvore[]> {
  const paginas = await db.pagina.findMany({
    where: { status: 'PUBLICADA', noMenu: true },
    select: { slug: true, titulo: true, paiId: true, id: true, ordem: true },
    orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
  })

  const raizes = paginas.filter((p) => !p.paiId)
  return raizes.map((r) => ({
    slug: r.slug,
    titulo: r.titulo,
    filhos: paginas.filter((p) => p.paiId === r.id).map((f) => ({ slug: f.slug, titulo: f.titulo, filhos: [] })),
  }))
}

/** Resolve tudo que os blocos referenciam numa passada só. */
export async function carregarDados(blocos: Blocos): Promise<DadosPagina> {
  const precisaEquipe = blocos.some((b) => b.tipo === 'equipe')
  const precisaMapa = blocos.some((b) => b.tipo === 'mapa')

  const petianos = precisaEquipe
    ? await db.petiano.findMany({
        where: { saiuEm: null },
        select: {
          id: true, nome: true, cargo: true, tutor: true, bio: true, fotoId: true,
          linkedin: true, curriculo: { select: { url: true } },
        },
        orderBy: [{ tutor: 'desc' }, { ordem: 'asc' }],
      })
    : []

  const idsBlocos = coletarMidiaIds(blocos)
  const idsPetianos = petianos.map((p) => p.fotoId).filter((v): v is string => !!v)
  const ids = [...new Set([...idsBlocos, ...idsPetianos])]

  const linhas = ids.length
    ? await db.midia.findMany({
        where: { id: { in: ids } },
        select: { id: true, url: true, alt: true, largura: true, altura: true },
      })
    : []

  const midias: MapaMidia = Object.fromEntries(linhas.map((m) => [m.id, m]))
  const arvore = precisaMapa ? await carregarArvore() : []

  return { midias, petianos, arvore }
}
