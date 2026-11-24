'use client'

import { useState } from 'react'
import { FOCO_PADRAO, type Foco } from '@/lib/enquadramento'
import type { OpcaoMidia } from './EscolhaFoto'
import { QuadroFoto } from './QuadroFoto'

/**
 * Escolha da foto do petiano + enquadramento dentro do card. O quadro usa a
 * mesma proporção (4:5) e o mesmo CSS (object-fit/position + zoom) do site
 * público, então o que aparece aqui é o que sai no card. Os valores vão em
 * campos escondidos no formulário (fotoX, fotoY, fotoZoom).
 */
export function EnquadrarFoto({
  midias,
  fotoIdInicial,
  focoInicial,
}: {
  midias: OpcaoMidia[]
  fotoIdInicial: string
  focoInicial: Foco
}) {
  const [fotoId, setFotoId] = useState(fotoIdInicial)
  const [foco, setFoco] = useState<Foco>(focoInicial)
  const midia = midias.find((m) => m.id === fotoId)

  return (
    <div className="campo">
      <span>Foto</span>
      <select
        name="fotoId"
        value={fotoId}
        onChange={(e) => {
          setFotoId(e.target.value)
          // o enquadramento de uma foto não serve em outra: volta ao centro
          setFoco(FOCO_PADRAO)
        }}
      >
        <option value="">— sem foto —</option>
        {midias.map((m) => (
          <option key={m.id} value={m.id}>{m.alt}</option>
        ))}
      </select>

      <input type="hidden" name="fotoX" value={foco.x} />
      <input type="hidden" name="fotoY" value={foco.y} />
      <input type="hidden" name="fotoZoom" value={foco.zoom} />

      {midia && (
        <QuadroFoto
          url={midia.url}
          largura={midia.largura}
          altura={midia.altura}
          foco={foco}
          onChange={setFoco}
          proporcao="4 / 5"
          faixa={{ texto: 'nome e cargo', altura: '27%' }}
        />
      )}
    </div>
  )
}
