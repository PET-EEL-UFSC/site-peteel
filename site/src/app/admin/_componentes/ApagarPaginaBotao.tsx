'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { apagarPagina } from '../acoes'

export function ApagarPaginaBotao({ paginaId, titulo, temFilhos }: { paginaId: string; titulo: string; temFilhos: boolean }) {
  const router = useRouter()
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  const apagar = () => {
    if (!confirm(`Apagar a página "${titulo}"? Essa ação não pode ser desfeita.`)) return
    setErro(null)
    iniciar(async () => {
      const r = await apagarPagina(paginaId)
      if (r.ok) router.refresh()
      else setErro(r.erro)
    })
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-claro"
        disabled={pendente || temFilhos}
        title={temFilhos ? 'Apague ou mova as subpáginas antes' : undefined}
        onClick={apagar}
        style={{ color: '#a11' }}
      >
        Apagar
      </button>
      {erro && <p className="aviso-erro" style={{ marginTop: 6, marginBottom: 0, textAlign: 'left' }}>{erro}</p>}
    </>
  )
}
