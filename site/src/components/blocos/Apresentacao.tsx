'use client'

import { useRef } from 'react'

const cond = 'var(--condensada)'

export function Apresentacao({
  apresentacaoId,
  proporcao,
  titulo,
  escuro,
}: {
  apresentacaoId: string | null
  proporcao: '16/9' | '4/3'
  titulo?: string
  escuro: boolean
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const borda = `3px solid ${escuro ? '#F9F9F9' : '#2C2B22'}`

  if (!apresentacaoId) {
    return (
      <div
        style={{
          aspectRatio: proporcao,
          border: borda,
          display: 'grid',
          placeItems: 'center',
          background: 'repeating-linear-gradient(135deg,#e6e5dd 0 7px,#d8d7cc 7px 14px)',
          font: `900 12px/1 ${cond}`,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#2C2B22',
        }}
      >
        apresentação (envie o arquivo no editor)
      </div>
    )
  }

  return (
    <div>
      <div style={{ position: 'relative', aspectRatio: proporcao, border: borda, background: '#000' }}>
        {/* sem allow-same-origin de propósito: o JS da apresentação roda isolado e não alcança cookies nem o admin */}
        <iframe
          ref={frame}
          src={`/apresentacao/${apresentacaoId}`}
          title={titulo ?? 'apresentação'}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          allow="fullscreen"
          allowFullScreen
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
      <button
        type="button"
        onClick={() => frame.current?.requestFullscreen?.()}
        style={{
          marginTop: 8,
          background: 'transparent',
          border: `2px solid ${escuro ? '#F9F9F9' : '#2C2B22'}`,
          color: escuro ? '#F9F9F9' : '#2C2B22',
          padding: '8px 14px',
          font: `900 11px/1 ${cond}`,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Tela cheia
      </button>
    </div>
  )
}
