import type { Blocos } from './blocos'
import type { Elemento } from './elementos'

export type MidiaResolvida = {
  id: string
  url: string
  alt: string
  largura: number
  altura: number
}

export type MapaMidia = Record<string, MidiaResolvida>

function idsDoElemento(el: Elemento): string[] {
  switch (el.tipo) {
    case 'foto':
      return el.foto.midiaId ? [el.foto.midiaId] : []
    case 'galeria':
      return el.itens.map((i) => i.midiaId).filter((v): v is string => !!v)
    case 'cards':
    case 'linhas':
      return el.itens.map((i) => i.foto?.midiaId).filter((v): v is string => !!v)
    default:
      return []
  }
}

/**
 * Junta todos os ids de mídia da página numa passada só. Sem isso cada
 * slot de foto viraria uma query e uma página com galeria faria dezenas.
 */
export function coletarMidiaIds(blocos: Blocos): string[] {
  const ids = new Set<string>()
  for (const b of blocos) {
    if (b.tipo === 'hero') {
      b.fotos.forEach((f) => f.midiaId && ids.add(f.midiaId))
    } else if (b.tipo === 'faixa') {
      b.quadrantes.flat().forEach((el) => idsDoElemento(el).forEach((id) => ids.add(id)))
      if (b.decor?.tipo === 'imagem' && b.decor.midiaId) ids.add(b.decor.midiaId)
    } else if (b.tipo === 'cabecalho') {
      if (b.decor?.tipo === 'imagem' && b.decor.midiaId) ids.add(b.decor.midiaId)
    }
  }
  return [...ids]
}
