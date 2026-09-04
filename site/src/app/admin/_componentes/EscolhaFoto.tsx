'use client'

import type { FotoRef } from '@/lib/content/elementos'

export type OpcaoMidia = { id: string; url: string; alt: string }

export function EscolhaFoto({ rotulo, valor, midias, onChange }: { rotulo: string; valor: FotoRef; midias: OpcaoMidia[]; onChange: (v: FotoRef) => void }) {
  const atual = valor.midiaId ? midias.find((m) => m.id === valor.midiaId) : undefined

  return (
    <div className="campo">
      <span>{rotulo}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 74, height: 58, flex: 'none', border: '2px solid var(--escuro)', overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#e6e5dd 0 7px,#d8d7cc 7px 14px)' }}>
          {atual && <img src={atual.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <select
            value={valor.midiaId ?? ''}
            onChange={(e) => onChange({ ...valor, midiaId: e.target.value || null })}
            style={{ width: '100%', border: '2px solid var(--escuro)', padding: '8px 10px', font: '400 13.5px var(--corpo)' }}
          >
            <option value="">— sem foto ainda —</option>
            {midias.map((m) => (
              <option key={m.id} value={m.id}>{m.alt}</option>
            ))}
          </select>

          <input
            type="text"
            value={valor.legenda ?? ''}
            placeholder="Texto do espaço vazio (ex: foto do protótipo)"
            onChange={(e) => onChange({ ...valor, legenda: e.target.value })}
            style={{ width: '100%', marginTop: 6, border: '2px solid rgba(44,43,34,0.3)', padding: '7px 10px', font: '400 13px var(--corpo)' }}
          />
        </div>
      </div>
      {midias.length === 0 && <p className="dica">Nenhuma imagem enviada ainda. Vá em Imagens para subir as primeiras.</p>}
    </div>
  )
}

/** Igual ao EscolhaFoto, mas sem o campo de legenda — pra decoração não é uma foto de conteúdo. */
export function EscolhaMidia({ rotulo, valor, midias, onChange, dica }: { rotulo: string; valor: string | null; midias: OpcaoMidia[]; onChange: (id: string | null) => void; dica?: string }) {
  const atual = valor ? midias.find((m) => m.id === valor) : undefined

  return (
    <div className="campo">
      <span>{rotulo}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 74, height: 58, flex: 'none', border: '2px solid var(--escuro)', overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#e6e5dd 0 7px,#d8d7cc 7px 14px)', display: 'grid', placeItems: 'center' }}>
          {atual && <img src={atual.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
        </div>
        <select
          value={valor ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          style={{ flex: 1, minWidth: 0, border: '2px solid var(--escuro)', padding: '8px 10px', font: '400 13.5px var(--corpo)' }}
        >
          <option value="">— nenhuma —</option>
          {midias.map((m) => (
            <option key={m.id} value={m.id}>{m.alt}</option>
          ))}
        </select>
      </div>
      {dica && <p className="dica">{dica}</p>}
      {midias.length === 0 && <p className="dica">Nenhuma imagem enviada ainda. Vá em Imagens para subir um PNG com fundo transparente.</p>}
    </div>
  )
}
