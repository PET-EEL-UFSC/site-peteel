import type { Blocos } from '@/lib/content/blocos'
import type { MapaMidia } from '@/lib/content/midia'
import { Faixa } from './Faixa'
import { Hero } from './Hero'
import { Cabecalho } from './Cabecalho'
import { Equipe, type PetianoResolvido } from './Equipe'
import { Mapa, type NoArvore } from './Mapa'

export type DadosPagina = {
  midias: MapaMidia
  petianos: PetianoResolvido[]
  arvore: NoArvore[]
}

export function RenderBlocos({ blocos, dados }: { blocos: Blocos; dados: DadosPagina }) {
  return (
    <>
      {blocos.map((b) => {
        switch (b.tipo) {
          case 'hero':
            return <Hero key={b.id} bloco={b} midias={dados.midias} />
          case 'cabecalho':
            return <Cabecalho key={b.id} bloco={b} />
          case 'faixa':
            return <Faixa key={b.id} bloco={b} midias={dados.midias} />
          case 'equipe':
            return <Equipe key={b.id} bloco={b} petianos={dados.petianos} midias={dados.midias} />
          case 'mapa':
            return <Mapa key={b.id} arvore={dados.arvore} />
        }
      })}
    </>
  )
}
