'use client'

import { createContext, useContext, useState } from 'react'
import { Icone } from './icones'

const Contexto = createContext<{ recolhido: boolean; alternar: () => void }>({ recolhido: false, alternar: () => {} })

/**
 * Casca do painel (a grade com a barra lateral e o conteúdo). A preferência
 * de recolher fica num cookie, e não no localStorage, pra o servidor já
 * renderizar a barra no estado certo: sem isso a página abriria larga e
 * "pularia" pro lado recolhido a cada recarga. O cookie só guarda um
 * 0/1 de aparência, nada sensível.
 */
export function PainelCasca({ recolhidoInicial, children }: { recolhidoInicial: boolean; children: React.ReactNode }) {
  const [recolhido, setRecolhido] = useState(recolhidoInicial)

  const alternar = () => {
    const novo = !recolhido
    setRecolhido(novo)
    try {
      document.cookie = `painel-recolhido=${novo ? 1 : 0}; path=/admin; max-age=31536000; samesite=lax`
    } catch {
      // sem cookie, a barra só não lembra a escolha na próxima visita
    }
  }

  return (
    <Contexto.Provider value={{ recolhido, alternar }}>
      <div className="painel" data-recolhido={recolhido ? '1' : '0'}>
        {children}
      </div>
    </Contexto.Provider>
  )
}

export function BotaoRecolher() {
  const { recolhido, alternar } = useContext(Contexto)
  const rotulo = recolhido ? 'Expandir menu' : 'Recolher menu'

  return (
    <button type="button" className="rodape-item btn-recolher" onClick={alternar} aria-expanded={!recolhido} aria-label={rotulo} title={rotulo}>
      <Icone nome={recolhido ? 'expandir' : 'recolher'} />
      <span className="nav-rotulo">{rotulo}</span>
    </button>
  )
}
