'use client'

import { useState, useTransition, useRef } from 'react'
import { salvarPetiano, apagarPetiano, enviarCurriculo, removerCurriculo } from '../acoes'
import type { OpcaoMidia } from './EscolhaFoto'

type P = {
  id: string; nome: string; cargo: string; tutor: boolean; bio: string | null
  fotoId: string | null; ordem: number; saiuEm: string | null; destino: string | null
  linkedin: string | null; curriculo: { url: string; nome: string } | null
}

function Curriculo({ petianoId, curriculo }: { petianoId: string; curriculo: { url: string; nome: string } | null }) {
  const form = useRef<HTMLFormElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  return (
    <div className="campo">
      <span>Currículo (PDF)</span>
      {curriculo && (
        <p style={{ margin: '4px 0 8px', font: '400 13px var(--corpo)' }}>
          Atual: <a href={curriculo.url} target="_blank" rel="noopener noreferrer">{curriculo.nome}</a>{' '}
          <button
            type="button"
            className="btn btn-perigo"
            style={{ marginLeft: 8, padding: '2px 10px', fontSize: 12 }}
            disabled={pendente}
            onClick={() => {
              if (!confirm('Remover o currículo atual?')) return
              iniciar(async () => {
                const r = await removerCurriculo(petianoId)
                setMsg(r.ok ? r.mensagem : r.erro)
              })
            }}
          >
            remover
          </button>
        </p>
      )}
      <form
        ref={form}
        action={(fd) =>
          iniciar(async () => {
            const arquivo = fd.get('arquivo')
            if (arquivo instanceof File && arquivo.size > 8 * 1024 * 1024) {
              setMsg(`O arquivo tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. O limite é 8 MB.`)
              return
            }
            const r = await enviarCurriculo(petianoId, fd)
            setMsg(r.ok ? r.mensagem : r.erro)
            if (r.ok) form.current?.reset()
          })
        }
        style={{ display: 'flex', gap: 10, alignItems: 'center' }}
      >
        <input type="file" name="arquivo" accept="application/pdf" required />
        <button type="submit" className="btn btn-claro" disabled={pendente}>
          {curriculo ? 'Trocar' : 'Enviar'}
        </button>
      </form>
      {msg && <p className="dica">{msg}</p>}
    </div>
  )
}

function Ficha({ p, midias, aoFechar }: { p: P | null; midias: OpcaoMidia[]; aoFechar: () => void }) {
  return (
    <form
      className="cartao"
      style={{ padding: 20, marginBottom: 22, maxWidth: 620 }}
      action={async (fd) => {
        await salvarPetiano(fd)
        aoFechar()
      }}
    >
      <h2 style={{ fontSize: 20, textTransform: 'uppercase', marginBottom: 14 }}>{p ? 'Editar pessoa' : 'Nova pessoa'}</h2>
      {p && <input type="hidden" name="id" value={p.id} />}

      <label className="campo">
        <span>Nome</span>
        <input type="text" name="nome" required defaultValue={p?.nome ?? ''} />
      </label>

      <label className="campo">
        <span>Cargo</span>
        <input type="text" name="cargo" required defaultValue={p?.cargo ?? ''} placeholder="Ex: Coord. de Pesquisa" />
      </label>

      <label className="campo">
        <span>Foto</span>
        <select name="fotoId" defaultValue={p?.fotoId ?? ''}>
          <option value="">— sem foto —</option>
          {midias.map((m) => (
            <option key={m.id} value={m.id}>{m.alt}</option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span>Descrição (opcional)</span>
        <textarea name="bio" defaultValue={p?.bio ?? ''} />
      </label>

      <label className="campo">
        <span>LinkedIn (opcional)</span>
        <input type="url" name="linkedin" defaultValue={p?.linkedin ?? ''} placeholder="https://linkedin.com/in/..." />
        <p className="dica">Aparece como botão no card da pessoa.</p>
      </label>

      {p && <Curriculo petianoId={p.id} curriculo={p.curriculo} />}
      {!p && <p className="dica">Salva a pessoa primeiro pra depois poder anexar o currículo.</p>}

      <label className="campo" style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
        <input type="checkbox" name="tutor" defaultChecked={p?.tutor ?? false} />
        <span style={{ margin: 0, textTransform: 'none', letterSpacing: 0, font: '400 14px var(--corpo)', color: 'var(--escuro)' }}>É o tutor do grupo</span>
      </label>

      <label className="campo">
        <span>Ordem na grade</span>
        <input type="number" name="ordem" defaultValue={p?.ordem ?? 0} />
      </label>

      <label className="campo">
        <span>Data de saída (se já saiu)</span>
        <input type="date" name="saiuEm" defaultValue={p?.saiuEm ?? ''} />
        <p className="dica">Preencher move a pessoa para a lista de ex-PETianos.</p>
      </label>

      <label className="campo">
        <span>Destino (para egressos)</span>
        <input type="text" name="destino" defaultValue={p?.destino ?? ''} placeholder="Ex: Mestrado na UFSC" />
      </label>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn">Salvar</button>
        <button type="button" className="btn btn-claro" onClick={aoFechar}>Cancelar</button>
      </div>
    </form>
  )
}

export function Pessoas({ petianos, midias }: { petianos: P[]; midias: OpcaoMidia[] }) {
  const [editando, setEditando] = useState<P | null | 'nova'>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  const ativos = petianos.filter((p) => !p.saiuEm)
  const egressos = petianos.filter((p) => p.saiuEm)

  const linha = (p: P) => (
    <tr key={p.id}>
      <td>
        {p.nome}
        {p.tutor && <span className="tag" style={{ marginLeft: 8, background: 'var(--amarelo)' }}>tutor</span>}
      </td>
      <td style={{ color: 'rgba(44,43,34,0.65)' }}>{p.cargo}</td>
      <td style={{ color: 'rgba(44,43,34,0.65)', font: '400 13px var(--corpo)' }}>{p.saiuEm ?? '—'}</td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button className="btn btn-claro" onClick={() => setEditando(p)}>Editar</button>{' '}
        <button
          className="btn btn-perigo"
          disabled={pendente}
          onClick={() => {
            if (!confirm(`Remover ${p.nome}?`)) return
            iniciar(async () => {
              const r = await apagarPetiano(p.id)
              setMsg(r.ok ? r.mensagem : r.erro)
            })
          }}
        >
          Remover
        </button>
      </td>
    </tr>
  )

  return (
    <>
      {msg && <p className="aviso-ok">{msg}</p>}

      {editando === null ? (
        <button className="btn" style={{ marginBottom: 20 }} onClick={() => setEditando('nova')}>+ Nova pessoa</button>
      ) : (
        <Ficha p={editando === 'nova' ? null : editando} midias={midias} aoFechar={() => setEditando(null)} />
      )}

      <table className="tabela">
        <thead>
          <tr><th>Nome</th><th>Cargo</th><th>Saída</th><th></th></tr>
        </thead>
        <tbody>{ativos.map(linha)}</tbody>
      </table>

      {egressos.length > 0 && (
        <>
          <h2 style={{ fontSize: 20, textTransform: 'uppercase', margin: '30px 0 12px' }}>Ex-PETianos</h2>
          <table className="tabela">
            <thead><tr><th>Nome</th><th>Cargo</th><th>Saída</th><th></th></tr></thead>
            <tbody>{egressos.map(linha)}</tbody>
          </table>
        </>
      )}
    </>
  )
}
