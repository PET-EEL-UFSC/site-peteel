'use client'

import { useState, useTransition, useRef } from 'react'
import { convidar, atualizarAcesso, alternarAcesso, mudarPapel, apagarAcesso } from '../acoes'

type U = {
  id: string
  email: string
  nome: string | null
  papel: 'ADMIN' | 'EDITOR'
  ativo: boolean
  gestao: string | null
  primeiroAcesso: string | null
  criadoEm: string
}

type Resposta = { ok: true; mensagem: string } | { ok: false; erro: string }

export function Acessos({ usuarios, meuId }: { usuarios: U[]; meuId: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, iniciar] = useTransition()
  const [editando, setEditando] = useState<string | null>(null)
  const form = useRef<HTMLFormElement>(null)

  const agir = (fn: () => Promise<Resposta>) =>
    iniciar(async () => {
      const r = await fn()
      setMsg(r.ok ? { ok: true, texto: r.mensagem } : { ok: false, texto: r.erro })
    })

  return (
    <>
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}

      <form
        ref={form}
        className="cartao"
        style={{ padding: 20, marginBottom: 24, maxWidth: 620, opacity: pendente ? 0.6 : 1, transition: 'opacity 120ms' }}
        action={(fd) =>
          iniciar(async () => {
            const r = await convidar(fd)
            setMsg(r.ok ? { ok: true, texto: r.mensagem } : { ok: false, texto: r.erro })
            if (r.ok) form.current?.reset()
          })
        }
      >
        <h2 style={{ fontSize: 20, textTransform: 'uppercase', marginBottom: 14 }}>Dar acesso</h2>

        <label className="campo">
          <span>Nome</span>
          <input type="text" name="nome" placeholder="Ex: Maria Silva" disabled={pendente} />
          <p className="dica">Se deixar em branco, entra o nome da conta Google no primeiro login.</p>
        </label>

        <label className="campo">
          <span>E-mail do Google</span>
          <input type="text" name="email" required placeholder="pessoa@gmail.com" disabled={pendente} />
          <p className="dica">Qualquer Gmail serve. Precisa ser a mesma conta com que a pessoa vai entrar.</p>
        </label>

        <label className="campo">
          <span>Pode fazer o quê</span>
          <select name="papel" defaultValue="EDITOR" disabled={pendente}>
            <option value="EDITOR">Editor — escreve, publica e sobe imagens</option>
            <option value="ADMIN">Administrador — também apaga páginas e gerencia acessos</option>
          </select>
        </label>

        <label className="campo">
          <span>Gestão (opcional)</span>
          <input type="text" name="gestao" placeholder="Ex: 2026.1" disabled={pendente} />
        </label>

        <button type="submit" className="btn" disabled={pendente}>
          {pendente ? 'Adicionando…' : 'Adicionar'}
        </button>
      </form>

      <table className="tabela" style={{ opacity: pendente ? 0.6 : 1, transition: 'opacity 120ms' }}>
        <thead>
          <tr>
            <th>Pessoa</th>
            <th style={{ width: 150 }}>Pode</th>
            <th style={{ width: 130 }}>Situação</th>
            <th style={{ width: 210 }}></th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) =>
            editando === u.id ? (
              <LinhaEdicao
                key={u.id}
                u={u}
                pendente={pendente}
                aoCancelar={() => setEditando(null)}
                aoSalvar={(nome, gestao) => {
                  setEditando(null)
                  agir(() => atualizarAcesso(u.id, { nome, gestao }))
                }}
              />
            ) : (
              <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.55 }}>
                <td>
                  {u.nome ?? <span style={{ color: 'rgba(44,43,34,0.45)' }}>sem nome</span>}
                  {u.id === meuId && <span className="tag" style={{ marginLeft: 8, background: 'var(--amarelo)' }}>você</span>}
                  <br />
                  <span style={{ font: '400 12.5px var(--corpo)', color: 'rgba(44,43,34,0.6)' }}>{u.email}</span>
                  {u.gestao && <span style={{ font: '400 12px var(--corpo)', color: 'rgba(44,43,34,0.45)' }}> · {u.gestao}</span>}
                </td>
                <td>
                  <select
                    value={u.papel}
                    disabled={pendente}
                    onChange={(e) => agir(() => mudarPapel(u.id, e.target.value as 'ADMIN' | 'EDITOR'))}
                    style={{ border: '2px solid var(--escuro)', padding: '6px 8px', font: '400 13px var(--corpo)' }}
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </td>
                <td style={{ font: '400 13px var(--corpo)', color: 'rgba(44,43,34,0.65)' }}>
                  {!u.ativo ? 'desativado' : u.primeiroAcesso ? 'ativo' : 'ainda não entrou'}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-claro" disabled={pendente} onClick={() => setEditando(u.id)} style={{ padding: '7px 11px' }}>
                    Editar
                  </button>{' '}
                  <button
                    className="btn btn-claro"
                    disabled={pendente}
                    onClick={() => agir(() => alternarAcesso(u.id, !u.ativo))}
                    style={{ padding: '7px 11px' }}
                    title={u.ativo ? 'Corta o acesso mas mantém o cadastro' : 'Devolve o acesso'}
                  >
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>{' '}
                  <button
                    className="btn btn-perigo"
                    disabled={pendente || u.id === meuId}
                    style={{ padding: '7px 11px' }}
                    onClick={() => {
                      if (!confirm(`Apagar o acesso de ${u.nome ?? u.email}?\n\nO que a pessoa publicou continua no site. Para voltar, ela precisa ser adicionada de novo.`)) return
                      agir(() => apagarAcesso(u.id))
                    }}
                  >
                    Apagar
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <p className="dica" style={{ marginTop: 8, maxWidth: '78ch' }}>
        <strong>Desativar</strong> corta o acesso na hora mas mantém o cadastro — serve para quem saiu do grupo e pode voltar.
        <strong> Apagar</strong> remove de vez; o que a pessoa publicou continua no site, só perde a assinatura.
        Nos dois casos o efeito é imediato, mesmo com a sessão aberta.
      </p>
    </>
  )
}

function LinhaEdicao({
  u,
  pendente,
  aoSalvar,
  aoCancelar,
}: {
  u: U
  pendente: boolean
  aoSalvar: (nome: string, gestao: string) => void
  aoCancelar: () => void
}) {
  const [nome, setNome] = useState(u.nome ?? '')
  const [gestao, setGestao] = useState(u.gestao ?? '')

  return (
    <tr style={{ background: '#fffdf0' }}>
      <td colSpan={3}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={nome}
            autoFocus
            placeholder="Nome"
            onChange={(e) => setNome(e.target.value)}
            style={{ border: '2px solid var(--escuro)', padding: '7px 10px', font: '400 14px var(--corpo)', minWidth: 220 }}
          />
          <input
            type="text"
            value={gestao}
            placeholder="Gestão (ex: 2026.1)"
            onChange={(e) => setGestao(e.target.value)}
            style={{ border: '2px solid var(--escuro)', padding: '7px 10px', font: '400 14px var(--corpo)', width: 170 }}
          />
          <span style={{ font: '400 12.5px var(--corpo)', color: 'rgba(44,43,34,0.6)' }}>{u.email}</span>
        </div>
      </td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button className="btn" disabled={pendente} onClick={() => aoSalvar(nome, gestao)} style={{ padding: '7px 12px' }}>
          Salvar
        </button>{' '}
        <button className="btn btn-claro" disabled={pendente} onClick={aoCancelar} style={{ padding: '7px 12px' }}>
          Cancelar
        </button>
      </td>
    </tr>
  )
}
