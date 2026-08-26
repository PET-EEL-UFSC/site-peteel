'use client'

import { useState } from 'react'
import { criarPagina } from '../acoes'

export function NovaPagina({ raizes }: { raizes: { id: string; titulo: string }[] }) {
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!aberto) {
    return (
      <button className="btn" onClick={() => setAberto(true)}>
        + Nova página
      </button>
    )
  }

  return (
    <div className="cartao" style={{ padding: 20, maxWidth: 560 }}>
      <h2 style={{ fontSize: 22, textTransform: 'uppercase', marginBottom: 14 }}>Nova página</h2>
      {erro && <p className="aviso-erro">{erro}</p>}

      <form
        action={async (fd) => {
          setErro(null)
          try {
            await criarPagina(fd)
          } catch (e) {
            const m = (e as Error).message
            // redirect() do Next lança de propósito; não é erro real
            if (!m.includes('NEXT_REDIRECT')) setErro(m)
          }
        }}
      >
        <label className="campo">
          <span>Título</span>
          <input type="text" name="titulo" required placeholder="Ex: Estágios de férias" />
        </label>

        <label className="campo">
          <span>Endereço</span>
          <input type="text" name="slug" required placeholder="/estagios-de-ferias" />
          <p className="dica">É o que aparece na barra do navegador. Use letras minúsculas e hífens.</p>
        </label>

        <label className="campo">
          <span>Fica dentro de</span>
          <select name="paiId" defaultValue="">
            <option value="">Nenhuma (aparece direto no menu)</option>
            {raizes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.titulo}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button type="submit" className="btn">Criar</button>
          <button type="button" className="btn btn-claro" onClick={() => setAberto(false)}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
