'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { enviarCertificado, registrarCertificado, removerCertificado } from '../acoes'
import { liberarCertificado, bloquearCertificado, liberarCertificados } from '../acoes-certificados'
import { percentualDePresenca } from '@/lib/presenca'

/** Mesma razão de existir do equivalente em EnvioApresentacao: contornar o teto de 4,5 MB de Server Action da Vercel. */
const USA_BLOB = process.env.NEXT_PUBLIC_STORAGE === 'blob'
const TAMANHO_MAX = 8 * 1024 * 1024

type Estado = 'pendente' | 'gerado' | 'enviado'
type Linha = { id: string; nome: string; email: string; estado: Estado; arquivo: string | null; presencas: number }
type Msg = { ok: boolean; texto: string } | null

function LinhaCertificado({ l, encontros }: { l: Linha; encontros: number }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<Msg>(null)
  const [pendente, iniciar] = useTransition()

  const agir = (fn: () => Promise<{ ok: boolean; mensagem?: string; erro?: string }>) =>
    iniciar(async () => {
      const r = await fn()
      setMsg(r.ok ? null : { ok: false, texto: r.erro ?? 'não consegui concluir' })
      if (r.ok) router.refresh()
    })

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
        setMsg(r.ok ? null : { ok: false, texto: r.erro })
        if (r.ok) router.refresh()
      } catch (e) {
        setMsg({ ok: false, texto: (e as Error).message || 'não consegui enviar o arquivo' })
      } finally {
        if (input.current) input.current.value = ''
      }
    })
  }

  const abrir = (
    <a href={`/api/admin/certificado/${l.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-claro">
      Abrir
    </a>
  )
  const seletor = (rotulo: string) => (
    <label className="btn btn-claro" style={{ cursor: pendente ? 'wait' : 'pointer', display: 'inline-block' }}>
      {pendente ? 'Enviando…' : rotulo}
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
  )

  return (
    <tr>
      <td>
        {l.nome}
        <div style={{ font: '400 12.5px var(--corpo)', color: 'rgba(44,43,34,0.6)' }}>{l.email}</div>
      </td>
      <td style={{ font: '400 13px var(--corpo)', whiteSpace: 'nowrap' }}>
        {encontros > 0 ? `${l.presencas}/${encontros} (${percentualDePresenca(l.presencas, encontros)}%)` : '—'}
      </td>
      <td style={{ font: '400 13px var(--corpo)' }}>
        {l.estado === 'pendente' && <span style={{ color: 'rgba(44,43,34,0.6)' }}>pendente</span>}
        {l.estado === 'gerado' && <span className="tag" style={{ background: 'var(--amarelo)' }}>liberado</span>}
        {l.estado === 'enviado' && (
          <>
            <span className="tag" style={{ background: 'var(--amarelo)' }}>PDF próprio</span> {l.arquivo}
          </>
        )}
        {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'} style={{ marginTop: 6 }}>{msg.texto}</p>}
      </td>
      <td style={{ whiteSpace: 'nowrap', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {l.estado === 'pendente' && (
          <>
            <button type="button" className="btn" disabled={pendente} onClick={() => agir(() => liberarCertificado(l.id))}>Liberar</button>
            {seletor('Enviar PDF próprio')}
          </>
        )}
        {l.estado === 'gerado' && (
          <>
            {abrir}
            <button type="button" className="btn btn-claro" disabled={pendente} onClick={() => agir(() => bloquearCertificado(l.id))}>Bloquear</button>
            {seletor('Enviar PDF próprio')}
          </>
        )}
        {l.estado === 'enviado' && (
          <>
            {abrir}
            {seletor('Trocar PDF')}
            <button
              type="button"
              className="btn btn-perigo"
              disabled={pendente}
              onClick={() => {
                if (confirm(`Remover o PDF de ${l.nome}? O arquivo é apagado e o certificado volta a ficar pendente.`)) agir(() => removerCertificado(l.id))
              }}
            >
              Remover PDF
            </button>
          </>
        )}
      </td>
    </tr>
  )
}

export function CertificadosMinicurso({ minicursoId, encontros, inscricoes }: { minicursoId: string; encontros: number; inscricoes: Linha[] }) {
  const router = useRouter()
  const [minimo, setMinimo] = useState('75')
  const [msg, setMsg] = useState<Msg>(null)
  const [pendente, iniciar] = useTransition()

  const liberados = inscricoes.filter((i) => i.estado !== 'pendente').length
  const faltam = inscricoes.length - liberados

  if (inscricoes.length === 0) return <p className="dica">Este minicurso ainda não tem inscritos.</p>

  const emLote = (minimoPercentual: number | null) =>
    iniciar(async () => {
      const r = await liberarCertificados(minicursoId, minimoPercentual)
      setMsg({ ok: r.ok, texto: (r.ok ? r.mensagem : r.erro) ?? '' })
      if (r.ok) router.refresh()
    })

  return (
    <>
      <div className="cartao" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <button
          type="button"
          className="btn"
          disabled={pendente || faltam === 0}
          onClick={() => {
            if (confirm(`Liberar o certificado dos ${faltam} alunos que ainda estão pendentes?`)) emLote(null)
          }}
        >
          Liberar todos os pendentes
        </button>
        <label className="campo" style={{ margin: 0 }}>
          <span>Frequência mínima (%)</span>
          <input type="number" min={1} max={100} value={minimo} onChange={(e) => setMinimo(e.target.value)} style={{ width: 90 }} />
        </label>
        <button
          type="button"
          className="btn btn-claro"
          disabled={pendente || faltam === 0 || encontros === 0}
          title={encontros === 0 ? 'Registre os encontros e as presenças primeiro' : undefined}
          onClick={() => emLote(parseInt(minimo, 10) || 0)}
        >
          Liberar quem atingiu a frequência
        </button>
        <p className="dica" style={{ margin: 0, flex: '1 1 260px' }}>
          {encontros === 0
            ? 'Sem encontros registrados, a frequência não pode ser usada. Marque a presença em Presença.'
            : `${encontros} encontro(s) registrado(s). ${liberados} de ${inscricoes.length} certificado(s) liberado(s).`}
        </p>
      </div>
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'} style={{ marginBottom: 12 }}>{msg.texto}</p>}

      <table className="tabela">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Frequência</th>
            <th>Certificado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {inscricoes.map((l) => (
            <LinhaCertificado key={l.id} l={l} encontros={encontros} />
          ))}
        </tbody>
      </table>
    </>
  )
}
