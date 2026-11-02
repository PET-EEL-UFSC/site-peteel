'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  criarMinicurso,
  atualizarMinicurso,
  apagarMinicurso,
  adicionarAlunos,
  removerInscricao,
} from '../acoes'

type Inscrito = { id: string; nome: string; email: string; matricula: string | null; certificado: boolean }
type M = { id: string; titulo: string; cargaHoraria: number | null; ativo: boolean; paginas: number; inscricoes: Inscrito[] }

type Msg = { ok: boolean; texto: string } | null

function horas(v: string): number | null {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

function NovoMinicurso() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [carga, setCarga] = useState('')
  const [msg, setMsg] = useState<Msg>(null)
  const [pendente, iniciar] = useTransition()

  return (
    <div className="cartao" style={{ padding: 18, marginBottom: 22, maxWidth: 620 }}>
      <h2 style={{ fontSize: 18, textTransform: 'uppercase', marginBottom: 12 }}>Novo minicurso</h2>
      <label className="campo">
        <span>Nome</span>
        <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Introdução à IA" maxLength={100} />
      </label>
      <label className="campo">
        <span>Carga horária (horas, opcional)</span>
        <input type="number" min={1} max={1000} value={carga} onChange={(e) => setCarga(e.target.value)} style={{ width: 120 }} />
        <p className="dica">Aparece pro aluno na Área do aluno.</p>
      </label>
      <button
        type="button"
        className="btn"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            const r = await criarMinicurso({ titulo, cargaHoraria: horas(carga) })
            setMsg({ ok: r.ok, texto: r.ok ? r.mensagem : r.erro })
            if (r.ok) {
              setTitulo('')
              setCarga('')
              router.refresh()
            }
          })
        }
      >
        {pendente ? 'Criando…' : 'Criar minicurso'}
      </button>
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'} style={{ marginTop: 10 }}>{msg.texto}</p>}
    </div>
  )
}

function CartaoMinicurso({ m, podeApagar }: { m: M; podeApagar: boolean }) {
  const router = useRouter()
  const [titulo, setTitulo] = useState(m.titulo)
  const [carga, setCarga] = useState(m.cargaHoraria?.toString() ?? '')
  const [ativo, setAtivo] = useState(m.ativo)
  const [lista, setLista] = useState('')
  const [msg, setMsg] = useState<Msg>(null)
  const [avisos, setAvisos] = useState<string[]>([])
  const [pendente, iniciar] = useTransition()

  const agir = (fn: () => Promise<{ ok: boolean; mensagem?: string; erro?: string; avisos?: string[] }>, aoSucesso?: () => void) =>
    iniciar(async () => {
      const r = await fn()
      setMsg({ ok: r.ok, texto: (r.ok ? r.mensagem : r.erro) ?? '' })
      setAvisos(r.avisos ?? [])
      if (r.ok) {
        aoSucesso?.()
        router.refresh()
      }
    })

  const enviados = m.inscricoes.filter((i) => i.certificado).length

  return (
    <details className="cartao" style={{ padding: '4px 18px 18px', marginBottom: 14 }}>
      <summary style={{ padding: '10px 0', cursor: 'pointer', font: '900 14px var(--condensada)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {m.titulo}
        <span style={{ marginLeft: 10, font: '400 13px var(--corpo)', textTransform: 'none', letterSpacing: 0, color: 'rgba(44,43,34,0.65)' }}>
          {m.inscricoes.length} inscrito(s) · {enviados} certificado(s) enviado(s)
        </span>
        {!m.ativo && <span className="tag" style={{ marginLeft: 8 }}>inativo</span>}
      </summary>

      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}
      {avisos.length > 0 && (
        <ul className="dica" style={{ margin: '0 0 12px 18px' }}>
          {avisos.slice(0, 10).map((a) => (
            <li key={a}>{a}</li>
          ))}
          {avisos.length > 10 && <li>…e mais {avisos.length - 10}</li>}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', margin: '8px 0 14px' }}>
        <label className="campo" style={{ flex: '1 1 260px', margin: 0 }}>
          <span>Nome</span>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={100} />
        </label>
        <label className="campo" style={{ margin: 0 }}>
          <span>Carga (h)</span>
          <input type="number" min={1} max={1000} value={carga} onChange={(e) => setCarga(e.target.value)} style={{ width: 90 }} />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 8 }}>
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          <span style={{ font: '400 14px var(--corpo)' }}>Ativo (aulas visíveis aos alunos)</span>
        </label>
        <button
          type="button"
          className="btn btn-claro"
          disabled={pendente}
          onClick={() => agir(() => atualizarMinicurso(m.id, { titulo, cargaHoraria: horas(carga), ativo }))}
        >
          Salvar
        </button>
      </div>

      <p className="dica" style={{ marginBottom: 14 }}>
        {m.paginas === 0
          ? 'Nenhuma página vinculada ainda. Crie uma página e, em Configurações da página, escolha "Só alunos do minicurso".'
          : `${m.paginas} página(s) vinculada(s) a este minicurso.`}
      </p>

      <label className="campo">
        <span>Inscrever pessoas</span>
        <textarea
          value={lista}
          onChange={(e) => setLista(e.target.value)}
          rows={5}
          placeholder={'maria@gmail.com, Maria da Silva, 21100123\njoao@grad.ufsc.br, João Souza'}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <p className="dica">
          Uma pessoa por linha: e-mail, nome e (opcional) matrícula, separados por vírgula ou colados de uma planilha. O e-mail precisa ser o da conta
          Google que a pessoa vai usar pra entrar.
        </p>
      </label>
      <button
        type="button"
        className="btn"
        disabled={pendente || !lista.trim()}
        onClick={() => agir(() => adicionarAlunos(m.id, lista), () => setLista(''))}
      >
        {pendente ? 'Enviando…' : 'Inscrever'}
      </button>

      {m.inscricoes.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 8px' }}>
            <h3 style={{ fontSize: 15, textTransform: 'uppercase', margin: 0 }}>Inscritos</h3>
            <Link href={`/admin/minicursos/${m.id}/certificados`} className="btn">
              Enviar certificados
            </Link>
          </div>
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Matrícula</th>
                <th>Certificado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {m.inscricoes.map((i) => (
                <tr key={i.id}>
                  <td>{i.nome}</td>
                  <td style={{ font: '400 13px var(--corpo)' }}>{i.email}</td>
                  <td style={{ font: '400 13px var(--corpo)' }}>{i.matricula ?? '—'}</td>
                  <td style={{ font: '400 13px var(--corpo)' }}>{i.certificado ? 'enviado' : 'pendente'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-perigo"
                      disabled={pendente}
                      onClick={() => {
                        if (confirm(`Remover ${i.nome} deste minicurso? Se não estiver em outro, os dados dela(e) são apagados e o acesso é cortado.`)) {
                          agir(() => removerInscricao(i.id))
                        }
                      }}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {podeApagar && (
        <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid rgba(44,43,34,0.12)' }}>
          <button
            type="button"
            className="btn btn-perigo"
            disabled={pendente}
            onClick={() => {
              if (confirm(`Apagar o minicurso "${m.titulo}" e todas as inscrições dele? Essa ação não pode ser desfeita.`)) {
                agir(() => apagarMinicurso(m.id))
              }
            }}
          >
            Apagar minicurso
          </button>
        </div>
      )}
    </details>
  )
}

export function Minicursos({ minicursos, podeApagar }: { minicursos: M[]; podeApagar: boolean }) {
  return (
    <>
      <NovoMinicurso />
      {minicursos.length === 0 && <p className="dica">Nenhum minicurso criado ainda.</p>}
      {minicursos.map((m) => (
        <CartaoMinicurso key={m.id} m={m} podeApagar={podeApagar} />
      ))}
    </>
  )
}
