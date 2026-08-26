'use client'

import { useTransition, useState } from 'react'
import { restaurarRevisao } from '../acoes'

type Rev = { id: string; criadoEm: string; resumo: string | null; autor: { nome: string | null; email: string } | null }

export function Revisoes({ revisoes }: { revisoes: Rev[] }) {
  const [pendente, iniciar] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div style={{ marginTop: 34, maxWidth: 720 }}>
      <h2 style={{ fontSize: 20, textTransform: 'uppercase', marginBottom: 12 }}>Histórico</h2>
      {msg && <p className="aviso-ok">{msg}</p>}
      <table className="tabela">
        <tbody>
          {revisoes.map((r) => (
            <tr key={r.id}>
              <td style={{ font: '400 13px var(--corpo)' }}>
                {new Date(r.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td style={{ font: '400 13px var(--corpo)', color: 'rgba(44,43,34,0.65)' }}>
                {r.resumo} · {r.autor?.nome ?? r.autor?.email ?? 'sistema'}
              </td>
              <td style={{ textAlign: 'right' }}>
                <button
                  className="btn btn-claro"
                  disabled={pendente}
                  onClick={() =>
                    iniciar(async () => {
                      const res = await restaurarRevisao(r.id)
                      setMsg(res.ok ? res.mensagem : res.erro)
                    })
                  }
                >
                  Restaurar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="dica" style={{ marginTop: 8 }}>Restaurar carrega a versão no rascunho. Nada vai ao ar sem você publicar.</p>
    </div>
  )
}
