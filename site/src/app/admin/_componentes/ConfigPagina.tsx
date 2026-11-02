'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarPagina, apagarPagina } from '../acoes'
import { Texto, Selecao, Alternador } from './campos'

type Props = {
  paginaId: string
  titulo: string
  slug: string
  paiId: string | null
  ordem: number
  noMenu: boolean
  fixa: boolean
  temFilhos: boolean
  raizes: { id: string; titulo: string }[]
  minicursoId: string | null
  minicursos: { id: string; titulo: string }[]
  podeGerenciar: boolean
  podeApagar: boolean
  onSalvo: (titulo: string, slug: string) => void
}

export function ConfigPagina({ paginaId, titulo, slug, paiId, ordem, noMenu, fixa, temFilhos, raizes, minicursoId, minicursos, podeGerenciar, podeApagar, onSalvo }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ titulo, slug, paiId: paiId ?? '', ordem, noMenu, minicursoId: minicursoId ?? '' })
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, iniciar] = useTransition()

  if (!podeGerenciar) return null

  const opcoesPai: [string, string][] = [['', 'Nenhuma (aparece direto no menu)'], ...raizes.map((r): [string, string] => [r.id, r.titulo])]

  const salvar = () =>
    iniciar(async () => {
      const r = await atualizarPagina(paginaId, {
        titulo: form.titulo,
        slug: form.slug,
        paiId: form.paiId || null,
        ordem: form.ordem,
        noMenu: form.noMenu,
        minicursoId: form.minicursoId || null,
      })
      if (r.ok) {
        setMsg({ ok: true, texto: r.mensagem })
        onSalvo(r.titulo, r.slug)
      } else {
        setMsg({ ok: false, texto: r.erro })
      }
    })

  const apagar = () => {
    if (!confirm(`Apagar a página "${titulo}"? Essa ação não pode ser desfeita.`)) return
    iniciar(async () => {
      const r = await apagarPagina(paginaId)
      if (r.ok) router.push('/admin')
      else setMsg({ ok: false, texto: r.erro })
    })
  }

  return (
    <details className="cartao" style={{ padding: '4px 18px 18px', marginBottom: 18 }}>
      <summary style={{ padding: '10px 0', cursor: 'pointer', font: '900 12px var(--condensada)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Configurações da página
      </summary>

      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}

      <Texto rotulo="Nome" valor={form.titulo} onChange={(v) => setForm({ ...form, titulo: v })} />

      {fixa ? (
        <label className="campo">
          <span>Endereço</span>
          <p className="dica">{slug} — página fixa do site, o endereço não pode mudar.</p>
        </label>
      ) : (
        <Texto
          rotulo="Endereço"
          valor={form.slug}
          onChange={(v) => setForm({ ...form, slug: v })}
          dica="Mudar o endereço não redireciona quem tinha o link antigo."
        />
      )}

      {fixa || temFilhos ? (
        <label className="campo">
          <span>Fica dentro de</span>
          <p className="dica">
            {fixa ? 'Página fixa do site — fica sempre no topo do menu.' : 'Esta página tem subpáginas, então precisa continuar no topo do menu.'}
          </p>
        </label>
      ) : (
        <Selecao rotulo="Fica dentro de" valor={form.paiId} opcoes={opcoesPai} onChange={(v) => setForm({ ...form, paiId: v })} />
      )}

      <label className="campo">
        <span>Posição no menu (número menor aparece primeiro)</span>
        <input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} style={{ width: 100 }} />
      </label>

      <Alternador rotulo="Aparece no menu do site" valor={form.noMenu} onChange={(v) => setForm({ ...form, noMenu: v })} />

      {!fixa && (
        <>
          <Selecao
            rotulo="Quem pode ver"
            valor={form.minicursoId}
            opcoes={[['', 'Qualquer pessoa (página pública)'], ...minicursos.map((m): [string, string] => [m.id, `Só alunos do minicurso: ${m.titulo}`])]}
            onChange={(v) => setForm({ ...form, minicursoId: v })}
          />
          {form.minicursoId && (
            <p className="dica" style={{ marginBottom: 12 }}>
              Página restrita: sai do menu e do mapa do site e só abre na Área do aluno (/aluno{slug}), para quem está inscrito neste minicurso.
              Vídeos do YouTube devem ser "não listados". Apresentações enviadas só ficam protegidas depois que a página for salva com elas.
            </p>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn" disabled={pendente} onClick={salvar}>
          {pendente ? 'Salvando…' : 'Salvar configurações'}
        </button>
        {podeApagar && !fixa && (
          <button
            type="button"
            className="btn btn-claro"
            disabled={pendente || temFilhos}
            title={temFilhos ? 'Apague ou mova as subpáginas antes' : undefined}
            onClick={apagar}
            style={{ marginLeft: 'auto', color: '#a11' }}
          >
            Apagar página
          </button>
        )}
      </div>
    </details>
  )
}
