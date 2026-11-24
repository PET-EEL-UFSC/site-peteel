'use client'

import { useRef, useState } from 'react'
import { estiloDoFoco, focoPorArrasto, limitar, sobraDaFoto, umaCasa, FOCO_PADRAO, type Foco } from '@/lib/enquadramento'

/**
 * Quadro de enquadramento: mostra a foto no mesmo formato do espaço onde
 * ela entra no site (mesmo CSS do <Foto> público: cobre o quadro, foco +
 * zoom em torno do foco) e deixa arrastar, dar zoom e usar as setas.
 * Controlado: quem usa guarda o foco e decide onde ele vai (campo escondido
 * do formulário, JSON do bloco...).
 */
export function QuadroFoto({
  url,
  largura,
  altura,
  foco,
  onChange,
  proporcao,
  larguraPx = 200,
  faixa,
}: {
  url: string
  largura?: number
  altura?: number
  foco: Foco
  onChange: (f: Foco) => void
  /** formato do espaço no site, como no CSS: "4/5", "16/10"... */
  proporcao: string
  larguraPx?: number
  /** faixa translúcida no pé do quadro (por onde passam nome e cargo, por exemplo) */
  faixa?: { texto: string; altura: string }
}) {
  const quadro = useRef<HTMLDivElement>(null)
  const arrasto = useRef<{ x: number; y: number; foco: Foco } | null>(null)
  const [arrastando, setArrastando] = useState(false)

  // por quanto a foto cobre o quadro em cada eixo (sem dimensões, assume quadrada)
  const medir = () => {
    const r = quadro.current?.getBoundingClientRect()
    if (!r) return null
    return { r, ...sobraDaFoto(largura ?? 1, altura ?? 1, r.width, r.height) }
  }

  const mover = (base: Foco, dx: number, dy: number) => {
    const s = medir()
    if (!s) return
    onChange({
      zoom: base.zoom,
      x: umaCasa(focoPorArrasto(base.x, dx, s.r.width, s.x, base.zoom)),
      y: umaCasa(focoPorArrasto(base.y, dy, s.r.height, s.y, base.zoom)),
    })
  }

  const fim = () => {
    arrasto.current = null
    setArrastando(false)
  }

  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 12 }}>
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
        onPointerUp={fim}
        onPointerCancel={fim}
        onKeyDown={(e) => {
          // a seta move a foto na direção dela (foto pra direita = foco diminui); passo em %, não em px
          const passo = e.shiftKey ? 5 : 1
          const d: Record<string, [number, number]> = { ArrowLeft: [passo, 0], ArrowRight: [-passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] }
          if (!d[e.key]) return
          e.preventDefault()
          onChange({ ...foco, x: limitar(umaCasa(foco.x + d[e.key][0]), 0, 100), y: limitar(umaCasa(foco.y + d[e.key][1]), 0, 100) })
        }}
        style={{
          position: 'relative',
          width: larguraPx,
          maxWidth: '100%',
          aspectRatio: proporcao,
          overflow: 'hidden',
          border: '2px solid var(--escuro)',
          background: '#ddd',
          cursor: arrastando ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          flex: 'none',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', ...estiloDoFoco(foco) }}
        />
        {faixa && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 'auto 0 0 0',
              height: faixa.altura,
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
            {faixa.texto}
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 180px', minWidth: 160 }}>
        <p className="dica" style={{ margin: '0 0 12px' }}>
          Arraste a foto pra enquadrar (ou use as setas do teclado). O que aparece aqui é o que sai no site.
          {faixa ? ' A faixa amarela é por onde passam o nome e o cargo.' : ''}
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
            onChange={(e) => onChange({ ...foco, zoom: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
        </label>
        <button type="button" className="btn btn-claro" style={{ marginTop: 10 }} onClick={() => onChange(FOCO_PADRAO)}>
          Centralizar e tirar zoom
        </button>
      </div>
    </div>
  )
}
