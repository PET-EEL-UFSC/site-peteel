'use client'

import { useRef, useState } from 'react'
import { estiloDoFoco, focoPorArrasto, limitar, sobraDaFoto, umaCasa, FOCO_PADRAO, type Foco } from '@/lib/enquadramento'
import type { OpcaoMidia } from './EscolhaFoto'

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
  const quadro = useRef<HTMLDivElement>(null)
  const arrasto = useRef<{ x: number; y: number; foco: Foco } | null>(null)
  const [arrastando, setArrastando] = useState(false)

  const midia = midias.find((m) => m.id === fotoId)

  // por quanto a foto cobre o quadro em cada eixo (sem dimensões, assume quadrada)
  const sobra = () => {
    const r = quadro.current?.getBoundingClientRect()
    if (!r || !midia) return null
    return { r, ...sobraDaFoto(midia.largura ?? 1, midia.altura ?? 1, r.width, r.height) }
  }

  const mover = (base: Foco, dx: number, dy: number) => {
    const s = sobra()
    if (!s) return
    setFoco({
      zoom: base.zoom,
      x: umaCasa(focoPorArrasto(base.x, dx, s.r.width, s.x, base.zoom)),
      y: umaCasa(focoPorArrasto(base.y, dy, s.r.height, s.y, base.zoom)),
    })
  }

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
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 12 }}>
          <div>
            <div
              ref={quadro}
              role="img"
              aria-label="Enquadramento da foto: arraste pra mover, setas do teclado também funcionam"
              tabIndex={0}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                arrasto.current = { x: e.clientX, y: e.clientY, foco }
                setArrastando(true)
              }}
              onPointerMove={(e) => {
                const a = arrasto.current
                if (a) mover(a.foco, e.clientX - a.x, e.clientY - a.y)
              }}
              onPointerUp={() => {
                arrasto.current = null
                setArrastando(false)
              }}
              onPointerCancel={() => {
                arrasto.current = null
                setArrastando(false)
              }}
              onKeyDown={(e) => {
                // a seta move a foto na direção dela (foto pra direita = foco diminui); passo em %, não em px
                const passo = e.shiftKey ? 5 : 1
                const d: Record<string, [number, number]> = { ArrowLeft: [passo, 0], ArrowRight: [-passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] }
                if (!d[e.key]) return
                e.preventDefault()
                setFoco((f) => ({ ...f, x: limitar(umaCasa(f.x + d[e.key][0]), 0, 100), y: limitar(umaCasa(f.y + d[e.key][1]), 0, 100) }))
              }}
              style={{
                position: 'relative',
                width: 200,
                aspectRatio: '4 / 5',
                overflow: 'hidden',
                border: '2px solid var(--escuro)',
                background: '#ddd',
                cursor: arrastando ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
              }}
            >
              {/* mesma lógica do <Foto> do site: cobre o quadro, foco + zoom em torno do foco */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={midia.url}
                alt=""
                draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', ...estiloDoFoco(foco) }}
              />
              {/* nos cards da grade, nome e cargo cobrem a parte de baixo da foto */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 'auto 0 0 0',
                  height: '27%',
                  background: 'rgba(253,234,0,0.55)',
                  borderTop: '2px dashed var(--escuro)',
                  display: 'grid',
                  placeItems: 'center',
                  font: '700 10px var(--condensada)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                }}
              >
                nome e cargo
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 200px', minWidth: 180 }}>
            <p className="dica" style={{ margin: '0 0 12px' }}>
              Arraste a foto pra enquadrar (ou use as setas do teclado). O que aparece aqui é o que sai no card; a faixa amarela é por onde passam o nome e o cargo.
            </p>
            <label style={{ display: 'block' }}>
              <span style={{ font: '700 11px var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(44,43,34,0.65)' }}>
                Zoom ({foco.zoom}%)
              </span>
              <input
                type="range"
                min={100}
                max={300}
                step={5}
                value={foco.zoom}
                onChange={(e) => setFoco((f) => ({ ...f, zoom: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </label>
            <button type="button" className="btn btn-claro" style={{ marginTop: 10 }} onClick={() => setFoco(FOCO_PADRAO)}>
              Centralizar e tirar zoom
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
