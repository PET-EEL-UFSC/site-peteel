'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { criarEncontro, apagarEncontro } from '../acoes-presenca'

type Encontro = { id: string; data: string; titulo: string | null; presentes: number }
type Msg = { ok: boolean; texto: string } | null

export function Encontros({ minicursoId, inscritos, encontros }: { minicursoId: string; inscritos: number; encontros: Encontro[] }) {
  const router = useRouter()
  // "hoje" no horário de Brasília (en-CA devolve aaaa-mm-dd)
  const [data, setData] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }))
  const [titulo, setTitulo] = useState('')
  const [msg, setMsg] = useState<Msg>(null)
  const [pendente, iniciar] = useTransition()

  return (
    <>
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}

      <div className="cartao" style={{ padding: 16, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="campo" style={{ margin: 0 }}>
          <span>Data do encontro</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="campo" style={{ margin: 0, flex: '1 1 220px' }}>
          <span>Título (opcional)</span>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} placeholder="Ex: Aula 2, prática" />
        </label>
        <button
          type="button"
          className="btn"
          disabled={pendente || !data}
          onClick={() =>
            iniciar(async () => {
              const r = await criarEncontro(minicursoId, data, titulo)
              setMsg({ ok: r.ok, texto: r.ok ? r.mensagem : r.erro })
              if (r.ok) {
                setTitulo('')
                router.refresh()
              }
            })
          }
        >
          Criar encontro
        </button>
      </div>

      {encontros.length === 0 ? (
        <p className="dica">Nenhum encontro ainda. Crie o primeiro acima e depois marque quem veio.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
          {encontros.map((e) => (
            <div key={e.id} className="cartao" style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <strong style={{ font: '900 16px var(--condensada)' }}>{e.data}</strong>
                {e.titulo && <span style={{ marginLeft: 8, font: '400 14px var(--corpo)' }}>{e.titulo}</span>}
                <div style={{ font: '400 13px var(--corpo)', color: 'rgba(44,43,34,0.65)' }}>{e.presentes} de {inscritos} presentes</div>
              </div>
              <Link href={`/admin/presenca/${minicursoId}/${e.id}`} className="btn">Marcar presença</Link>
              <button
                type="button"
                className="btn btn-perigo"
                disabled={pendente}
                onClick={() => {
                  if (!confirm(`Apagar o encontro de ${e.data}? As presenças dele também são apagadas.`)) return
                  iniciar(async () => {
                    const r = await apagarEncontro(e.id)
                    setMsg({ ok: r.ok, texto: r.ok ? r.mensagem : r.erro })
                    if (r.ok) router.refresh()
                  })
                }}
              >
                Apagar
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
