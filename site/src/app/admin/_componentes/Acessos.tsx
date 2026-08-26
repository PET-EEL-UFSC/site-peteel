'use client'

import { useState, useTransition } from 'react'
import { convidar, alternarAcesso, mudarPapel } from '../acoes'

type U = { id: string; email: string; nome: string | null; papel: 'ADMIN' | 'EDITOR'; ativo: boolean; gestao: string | null; primeiroAcesso: string | null; criadoEm: string }

export function Acessos({ usuarios, meuId }: { usuarios: U[]; meuId: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, iniciar] = useTransition()

  const agir = (fn: () => Promise<{ ok: true; mensagem: string } | { ok: false; erro: string }>) =>
    iniciar(async () => {
      const r = await fn()
      setMsg(r.ok ? { ok: true, texto: r.mensagem } : { ok: false, texto: r.erro })
    })

  return (
    <>
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}

      <form
        className="cartao"
        style={{ padding: 20, marginBottom: 24, maxWidth: 560 }}
        action={async (fd) => {
          try {
            await convidar(fd)
            setMsg({ ok: true, texto: 'Pessoa adicionada. Ela já pode entrar com o Google.' })
          } catch (e) {
            setMsg({ ok: false, texto: (e as Error).message })
          }
        }}
      >
        <h2 style={{ fontSize: 20, textTransform: 'uppercase', marginBottom: 14 }}>Dar acesso</h2>

        <label className="campo">
          <span>E-mail do Google</span>
          <input type="text" name="email" required placeholder="pessoa@gmail.com" />
          <p className="dica">Qualquer Gmail serve. Precisa ser a mesma conta com que a pessoa vai entrar.</p>
        </label>

        <label className="campo">
          <span>Pode fazer o quê</span>
          <select name="papel" defaultValue="EDITOR">
            <option value="EDITOR">Editor — escreve e salva rascunho</option>
            <option value="ADMIN">Administrador — também publica e gerencia acessos</option>
          </select>
        </label>

        <label className="campo">
          <span>Gestão (opcional)</span>
          <input type="text" name="gestao" placeholder="Ex: 2026.1" />
        </label>

        <button type="submit" className="btn">Adicionar</button>
      </form>

      <table className="tabela">
        <thead>
          <tr><th>Pessoa</th><th>Pode</th><th>Situação</th><th></th></tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.55 }}>
              <td>
                {u.nome ?? '—'}
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
              <td style={{ textAlign: 'right' }}>
                <button className={u.ativo ? 'btn btn-perigo' : 'btn btn-claro'} disabled={pendente} onClick={() => agir(() => alternarAcesso(u.id, !u.ativo))}>
                  {u.ativo ? 'Desativar' : 'Reativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="dica" style={{ marginTop: 8 }}>
        Desativar tem efeito imediato: o painel confere o acesso no banco a cada carregamento, mesmo com a sessão aberta.
      </p>
    </>
  )
}
