'use client'

import { useEffect, useRef, useState } from 'react'
import type { Blocos } from '@/lib/content/blocos'

type Largura = 'desktop' | 'celular'
const LARGURAS: Record<Largura, number> = { desktop: 1280, celular: 390 }

/**
 * Prévia real da página, num iframe.
 *
 * Iframe e não render inline por causa das media queries: o layout
 * responsivo responde à largura da janela, então só um documento com
 * viewport próprio consegue mostrar o celular de verdade. O iframe é
 * montado na largura escolhida e encolhido por transform, para caber na
 * coluna sem mentir sobre o layout.
 */
export function Previa({ paginaId, blocos, selecionado }: { paginaId: string; blocos: Blocos; selecionado: string | undefined }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const caixa = useRef<HTMLDivElement>(null)
  const [pronta, setPronta] = useState(false)
  const [largura, setLargura] = useState<Largura>('desktop')
  const [escala, setEscala] = useState(1)

  // ouve o "pronta" do iframe antes de mandar qualquer coisa
  useEffect(() => {
    function aoReceber(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if ((e.data as { tipo?: string })?.tipo === 'pronta') setPronta(true)
    }
    window.addEventListener('message', aoReceber)
    return () => window.removeEventListener('message', aoReceber)
  }, [])

  // recalcula a escala quando a coluna muda de tamanho
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const medir = () => setEscala(Math.min(1, el.clientWidth / LARGURAS[largura]))
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [largura])

  // manda o conteúdo a cada alteração, com folga para não postar a cada tecla
  useEffect(() => {
    if (!pronta) return
    const t = setTimeout(() => {
      frame.current?.contentWindow?.postMessage({ tipo: 'blocos', blocos }, window.location.origin)
    }, 180)
    return () => clearTimeout(t)
  }, [blocos, pronta])

  // rola até o bloco que está sendo editado
  useEffect(() => {
    if (!pronta || !selecionado) return
    frame.current?.contentWindow?.postMessage({ tipo: 'selecionar', id: selecionado }, window.location.origin)
  }, [selecionado, pronta])

  const alt = largura === 'desktop' ? 900 : 780

  return (
    <div className="previa-caixa">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ font: '900 11px var(--condensada)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(44,43,34,0.6)' }}>Prévia</span>
        {(['desktop', 'celular'] as Largura[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLargura(l)}
            className="btn btn-claro"
            style={{ padding: '6px 12px', ...(largura === l ? { background: 'var(--amarelo)' } : {}) }}
          >
            {l === 'desktop' ? 'Computador' : 'Celular'}
          </button>
        ))}
        <span className="dica" style={{ marginLeft: 'auto' }}>{Math.round(escala * 100)}%</span>
      </div>

      <div ref={caixa} style={{ border: '2px solid var(--escuro)', background: '#fff', overflow: 'hidden', height: alt * escala }}>
        <iframe
          ref={frame}
          src={`/previa/${paginaId}`}
          title="Prévia da página"
          style={{
            width: LARGURAS[largura],
            height: alt,
            border: 0,
            transform: `scale(${escala})`,
            transformOrigin: 'top left',
            display: 'block',
          }}
        />
      </div>
      <p className="dica" style={{ marginTop: 6 }}>
        Mostra o rascunho, atualizando enquanto você edita. O site só muda quando você publicar.
      </p>
    </div>
  )
}
