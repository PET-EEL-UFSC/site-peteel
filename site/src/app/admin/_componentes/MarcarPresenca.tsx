'use client'

import { useState, useTransition } from 'react'
import { marcarPresenca, marcarTodos } from '../acoes-presenca'

type Aluno = { inscricaoId: string; nome: string; presente: boolean }

/**
 * Pensada pra usar no celular, em sala: linha grande, um toque pra marcar.
 * Marca na hora na tela e confirma no servidor; se o servidor recusar, a
 * linha volta ao que era e o erro aparece, pra ninguém achar que salvou o
 * que não salvou.
 */
export function MarcarPresenca({ encontroId, alunos }: { encontroId: string; alunos: Aluno[] }) {
  const [presentes, setPresentes] = useState<Set<string>>(() => new Set(alunos.filter((a) => a.presente).map((a) => a.inscricaoId)))
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  const alternar = (id: string, valor: boolean) => {
    setErro(null)
    setPresentes((s) => {
      const n = new Set(s)
      if (valor) n.add(id)
      else n.delete(id)
      return n
    })
    iniciar(async () => {
      const r = await marcarPresenca(encontroId, id, valor)
      if (!r.ok) {
        setErro(r.erro)
        setPresentes((s) => {
          const n = new Set(s)
          if (valor) n.delete(id)
          else n.add(id)
          return n
        })
      }
    })
  }

  const todos = (valor: boolean) => {
    setErro(null)
    const antes = presentes
    setPresentes(valor ? new Set(alunos.map((a) => a.inscricaoId)) : new Set())
    iniciar(async () => {
      const r = await marcarTodos(encontroId, valor)
      if (!r.ok) {
        setErro(r.erro)
        setPresentes(antes)
      }
    })
  }

  if (alunos.length === 0) return <p className="dica">Este minicurso ainda não tem alunos inscritos.</p>

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', margin: '8px 0 14px' }}>
        <strong style={{ font: '900 15px var(--condensada)', letterSpacing: '0.04em' }}>
          {presentes.size} de {alunos.length} presentes
        </strong>
        <button type="button" className="btn btn-claro" disabled={pendente} onClick={() => todos(true)}>Todos presentes</button>
        <button type="button" className="btn btn-claro" disabled={pendente} onClick={() => todos(false)}>Limpar</button>
      </div>
      {erro && <p className="aviso-erro">{erro}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alunos.map((a) => {
          const ok = presentes.has(a.inscricaoId)
          return (
            <label
              key={a.inscricaoId}
              className="cartao"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                cursor: 'pointer',
                background: ok ? 'var(--amarelo)' : '#fff',
              }}
            >
              <input
                type="checkbox"
                checked={ok}
                onChange={(e) => alternar(a.inscricaoId, e.target.checked)}
                style={{ width: 26, height: 26, flex: 'none' }}
              />
              <span style={{ font: '700 16px var(--corpo)' }}>{a.nome}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
