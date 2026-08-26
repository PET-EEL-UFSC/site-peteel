'use client'

import { useState, useTransition, useRef } from 'react'
import { enviarImagem, apagarImagem } from '../acoes'

type M = { id: string; url: string; alt: string; largura: number; altura: number; tamanho: number; criadoEm: string }

export function Biblioteca({ midias }: { midias: M[] }) {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, iniciar] = useTransition()
  const form = useRef<HTMLFormElement>(null)

  return (
    <>
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}

      <form
        ref={form}
        className="cartao"
        style={{ padding: 20, marginBottom: 26, maxWidth: 560 }}
        action={(fd) =>
          iniciar(async () => {
            const r = await enviarImagem(fd)
            setMsg(r.ok ? { ok: true, texto: r.mensagem } : { ok: false, texto: r.erro })
            if (r.ok) form.current?.reset()
          })
        }
      >
        <label className="campo">
          <span>Arquivo</span>
          <input type="file" name="arquivo" accept="image/jpeg,image/png,image/webp,image/avif" required />
          <p className="dica">JPG, PNG, WebP ou AVIF, até 8 MB.</p>
        </label>

        <label className="campo">
          <span>Descrição da imagem</span>
          <input type="text" name="alt" required placeholder="Ex: petianos montando o protótipo do Retro Pong" />
          <p className="dica">Obrigatória. É o que pessoas cegas ouvem no lugar da foto.</p>
        </label>

        <button type="submit" className="btn" disabled={pendente}>
          {pendente ? 'Enviando…' : 'Enviar imagem'}
        </button>
      </form>

      {midias.length === 0 ? (
        <p className="dica">Nenhuma imagem ainda.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 16 }}>
          {midias.map((m) => (
            <div key={m.id} className="cartao">
              <div style={{ aspectRatio: '4/3', overflow: 'hidden', borderBottom: '2px solid var(--escuro)' }}>
                <img src={m.url} alt={m.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <p style={{ font: '400 13px/1.4 var(--corpo)' }}>{m.alt}</p>
                <p className="dica">{m.largura}×{m.altura} · {(m.tamanho / 1024).toFixed(0)} KB</p>
                <button
                  className="btn btn-perigo"
                  style={{ marginTop: 8, padding: '7px 12px' }}
                  disabled={pendente}
                  onClick={() =>
                    iniciar(async () => {
                      const r = await apagarImagem(m.id)
                      setMsg(r.ok ? { ok: true, texto: r.mensagem } : { ok: false, texto: r.erro })
                    })
                  }
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
