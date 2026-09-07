'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { enviarImagem, apagarImagem } from '../acoes'

type M = { id: string; url: string; alt: string; largura: number; altura: number; tamanho: number; criadoEm: string }

/**
 * Server Action tem teto de 4,5 MB de corpo de requisição imposto pela
 * Vercel — bem menor que os 8 MB que este formulário aceita. Acima
 * disso a requisição nem chega no nosso código: o navegador só vê a
 * conexão cair, sem mensagem nenhuma. Em produção o navegador manda o
 * arquivo direto pro Blob (rota /api/midia/upload só autoriza e
 * registra); em dev local não tem Blob, então segue pela Server Action
 * mesmo — não tem esse teto fora da Vercel.
 */
const USA_BLOB = process.env.NEXT_PUBLIC_STORAGE === 'blob'

function dimensoesDoArquivo(arquivo: File): Promise<{ largura: number; altura: number }> {
  return createImageBitmap(arquivo)
    .then((bmp) => {
      const dim = { largura: bmp.width, altura: bmp.height }
      bmp.close()
      return dim
    })
    .catch(() => ({ largura: 1200, altura: 900 }))
}

export function Biblioteca({ midias }: { midias: M[] }) {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, iniciar] = useTransition()
  const form = useRef<HTMLFormElement>(null)
  const router = useRouter()

  return (
    <>
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}

      <form
        ref={form}
        className="cartao"
        style={{ padding: 20, marginBottom: 26, maxWidth: 560 }}
        action={(fd) =>
          iniciar(async () => {
            const arquivo = fd.get('arquivo')
            const alt = String(fd.get('alt') ?? '').trim()

            if (!(arquivo instanceof File) || arquivo.size === 0) {
              setMsg({ ok: false, texto: 'nenhum arquivo escolhido' })
              return
            }
            if (arquivo.size > 8 * 1024 * 1024) {
              setMsg({ ok: false, texto: `A imagem tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. O limite é 8 MB — redimensiona ou comprime antes de enviar.` })
              return
            }
            if (alt.length < 3) {
              setMsg({ ok: false, texto: 'descreva a imagem em poucas palavras — é o que leitores de tela leem' })
              return
            }

            if (USA_BLOB) {
              try {
                const { largura, altura } = await dimensoesDoArquivo(arquivo)
                await upload(arquivo.name, arquivo, {
                  access: 'public',
                  handleUploadUrl: '/api/midia/upload',
                  clientPayload: JSON.stringify({ alt, largura, altura, tamanho: arquivo.size }),
                })
                setMsg({ ok: true, texto: 'Imagem enviada.' })
                form.current?.reset()
                router.refresh()
              } catch (e) {
                setMsg({ ok: false, texto: (e as Error).message || 'não consegui enviar a imagem' })
              }
              return
            }

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
