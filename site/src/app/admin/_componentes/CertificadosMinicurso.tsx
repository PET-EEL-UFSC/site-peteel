'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { enviarCertificado, registrarCertificado, removerCertificado } from '../acoes'

/** Mesma razão de existir do equivalente em EnvioApresentacao: contornar o teto de 4,5 MB de Server Action da Vercel. */
const USA_BLOB = process.env.NEXT_PUBLIC_STORAGE === 'blob'
const TAMANHO_MAX = 8 * 1024 * 1024

type Linha = { id: string; nome: string; email: string; arquivo: string | null }

function LinhaCertificado({ l }: { l: Linha }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, iniciar] = useTransition()

  const enviar = (arquivo: File) => {
    if (!/\.pdf$/i.test(arquivo.name)) return setMsg({ ok: false, texto: 'Envie um arquivo .pdf.' })
    if (arquivo.size > TAMANHO_MAX) {
      return setMsg({ ok: false, texto: `O arquivo tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. O limite é 8 MB.` })
    }

    setMsg(null)
    iniciar(async () => {
      try {
        let r
        if (USA_BLOB) {
          // o nome no storage é aleatório: nome de aluno não vai parar no endereço do arquivo
          const blob = await upload(`certificados/${crypto.randomUUID()}.pdf`, arquivo, {
            access: 'public',
            handleUploadUrl: '/api/certificado/upload',
            contentType: 'application/pdf',
          })
          r = await registrarCertificado(l.id, { url: blob.url, chave: blob.pathname, nome: arquivo.name, tamanho: arquivo.size })
        } else {
          const fd = new FormData()
          fd.set('arquivo', arquivo)
          r = await enviarCertificado(l.id, fd)
        }
        setMsg(r.ok ? { ok: true, texto: 'Enviado.' } : { ok: false, texto: r.erro })
        if (r.ok) router.refresh()
      } catch (e) {
        setMsg({ ok: false, texto: (e as Error).message || 'não consegui enviar o arquivo' })
      } finally {
        if (input.current) input.current.value = ''
      }
    })
  }

  return (
    <tr>
      <td>
        {l.nome}
        <div style={{ font: '400 12.5px var(--corpo)', color: 'rgba(44,43,34,0.6)' }}>{l.email}</div>
      </td>
      <td style={{ font: '400 13px var(--corpo)' }}>
        {l.arquivo ? (
          <>
            <span className="tag" style={{ background: 'var(--amarelo)' }}>enviado</span>{' '}
            <a href={`/api/admin/certificado/${l.id}`} target="_blank" rel="noopener noreferrer">{l.arquivo}</a>
          </>
        ) : (
          <span style={{ color: 'rgba(44,43,34,0.6)' }}>pendente</span>
        )}
        {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'} style={{ marginTop: 6 }}>{msg.texto}</p>}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <label className="btn btn-claro" style={{ cursor: pendente ? 'wait' : 'pointer', display: 'inline-block' }}>
          {pendente ? 'Enviando…' : l.arquivo ? 'Trocar PDF' : 'Enviar PDF'}
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            disabled={pendente}
            style={{ display: 'none' }}
            onChange={(e) => {
              const arquivo = e.target.files?.[0]
              if (arquivo) enviar(arquivo)
            }}
          />
        </label>
        {l.arquivo && (
          <button
            type="button"
            className="btn btn-perigo"
            style={{ marginLeft: 8 }}
            disabled={pendente}
            onClick={() => {
              if (!confirm(`Remover o certificado de ${l.nome}? O arquivo é apagado.`)) return
              iniciar(async () => {
                const r = await removerCertificado(l.id)
                setMsg({ ok: r.ok, texto: r.ok ? r.mensagem : r.erro })
                if (r.ok) router.refresh()
              })
            }}
          >
            Remover
          </button>
        )}
      </td>
    </tr>
  )
}

export function CertificadosMinicurso({ inscricoes }: { inscricoes: Linha[] }) {
  const enviados = inscricoes.filter((i) => i.arquivo).length

  if (inscricoes.length === 0) return <p className="dica">Este minicurso ainda não tem inscritos.</p>

  return (
    <>
      <p className="dica" style={{ marginBottom: 10 }}>{enviados} de {inscricoes.length} certificado(s) enviado(s).</p>
      <table className="tabela">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Certificado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {inscricoes.map((l) => (
            <LinhaCertificado key={l.id} l={l} />
          ))}
        </tbody>
      </table>
    </>
  )
}
