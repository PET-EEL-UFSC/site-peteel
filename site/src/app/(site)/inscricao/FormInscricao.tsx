'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { enviarPreInscricao } from './acoes'

const campo = {
  width: '100%',
  border: '2px solid var(--escuro)',
  background: '#fff',
  padding: '12px 14px',
  font: '400 16px var(--corpo)',
} as const

const rotulo = {
  display: 'block',
  marginBottom: 6,
  font: '900 11px/1 var(--condensada)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
} as const

export function FormInscricao({ slug }: { slug: string }) {
  const aberturaEm = useRef(0)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pendente, iniciar] = useTransition()

  useEffect(() => {
    aberturaEm.current = Date.now()
  }, [])

  if (enviado) {
    return (
      <div role="status" style={{ border: '3px solid var(--escuro)', background: 'var(--amarelo)', padding: '24px 26px' }}>
        <h2 style={{ fontSize: 26, textTransform: 'uppercase', lineHeight: 1.05 }}>Pedido recebido</h2>
        <p style={{ marginTop: 10, font: '400 16px/1.6 var(--corpo)' }}>
          A organização vai analisar. Depois de aprovado, entre na <a href="/aluno" style={{ textDecoration: 'underline' }}>Área do aluno</a> com a mesma conta
          Google do e-mail que você informou. Não enviamos e-mail de confirmação.
        </p>
      </div>
    )
  }

  return (
    <form
      action={(fd) => {
        fd.set('tempoMs', String(Date.now() - aberturaEm.current))
        setErro(null)
        iniciar(async () => {
          const r = await enviarPreInscricao(slug, fd)
          if (r.ok) setEnviado(true)
          else setErro(r.erro)
        })
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <label>
        <span style={rotulo}>Nome completo</span>
        <input name="nome" type="text" required minLength={2} maxLength={80} autoComplete="name" style={campo} />
      </label>

      <label>
        <span style={rotulo}>E-mail da conta Google</span>
        <input name="email" type="email" required maxLength={120} autoComplete="email" style={campo} />
        <small style={{ display: 'block', marginTop: 6, font: '400 13px/1.5 var(--corpo)', color: 'rgba(44,43,34,0.7)' }}>
          É com esse e-mail que você vai entrar na Área do aluno.
        </small>
      </label>

      <label>
        <span style={rotulo}>Matrícula (opcional)</span>
        <input name="matricula" type="text" maxLength={20} style={campo} />
      </label>

      {/* armadilha pra robô: escondida de quem usa o site, nunca deve ser preenchida */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Empresa
          <input name="empresa" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {erro && (
        <p role="alert" style={{ background: 'var(--escuro)', color: '#F9F9F9', padding: '12px 14px', borderLeft: '4px solid var(--laranja)', font: '400 14.5px/1.5 var(--corpo)' }}>
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        style={{
          alignSelf: 'flex-start',
          background: 'var(--escuro)',
          color: 'var(--amarelo)',
          border: 'none',
          padding: '16px 26px',
          font: '900 13px/1 var(--condensada)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: pendente ? 'wait' : 'pointer',
          opacity: pendente ? 0.6 : 1,
        }}
      >
        {pendente ? 'Enviando…' : 'Enviar pedido de inscrição'}
      </button>
    </form>
  )
}
