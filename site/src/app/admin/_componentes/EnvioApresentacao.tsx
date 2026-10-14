'use client'

import { useRef, useState, useTransition } from 'react'
import { upload } from '@vercel/blob/client'
import { enviarApresentacao, registrarApresentacao } from '../acoes'

/** Mesma razão de existir do equivalente em Pessoas.tsx: contornar o teto de 4,5 MB de Server Action da Vercel. */
const USA_BLOB = process.env.NEXT_PUBLIC_STORAGE === 'blob'
const TAMANHO_MAX = 25 * 1024 * 1024

export function EnvioApresentacao({
  nomeAtual,
  onEnviado,
}: {
  nomeAtual?: string
  onEnviado: (id: string, nome: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null)
  const [pendente, iniciar] = useTransition()

  const enviar = (arquivo: File) => {
    if (!/\.html?$/i.test(arquivo.name)) return setMsg({ texto: 'Envie um arquivo .html.', ok: false })
    if (arquivo.size > TAMANHO_MAX) {
      return setMsg({ texto: `O arquivo tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. O limite é 25 MB.`, ok: false })
    }

    setMsg(null)
    iniciar(async () => {
      try {
        let r
        if (USA_BLOB) {
          const blob = await upload(arquivo.name, arquivo, {
            access: 'public',
            handleUploadUrl: '/api/apresentacao/upload',
            contentType: 'text/html',
          })
          r = await registrarApresentacao({ url: blob.url, chave: blob.pathname, nome: arquivo.name, tamanho: arquivo.size })
        } else {
          const fd = new FormData()
          fd.set('arquivo', arquivo)
          r = await enviarApresentacao(fd)
        }

        if (r.ok) {
          onEnviado(r.id, r.nome)
          setMsg({ texto: 'Apresentação enviada. Lembre de salvar o rascunho.', ok: true })
        } else {
          setMsg({ texto: r.erro, ok: false })
        }
      } catch (e) {
        setMsg({ texto: (e as Error).message || 'não consegui enviar o arquivo', ok: false })
      } finally {
        if (input.current) input.current.value = ''
      }
    })
  }

  return (
    <div className="campo">
      <span>Arquivo da apresentação (.html)</span>
      {nomeAtual && <p style={{ margin: '4px 0 8px', font: '400 13px var(--corpo)' }}>Em uso: {nomeAtual}</p>}
      <input
        ref={input}
        type="file"
        accept=".html,.htm,text/html"
        disabled={pendente}
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          if (arquivo) enviar(arquivo)
        }}
      />
      {pendente && <p className="dica">Enviando…</p>}
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'} style={{ marginTop: 8 }}>{msg.texto}</p>}
      <p className="dica">Um arquivo só, com tudo embutido (imagens, estilos e scripts). Escolher outro arquivo troca a apresentação.</p>
    </div>
  )
}
