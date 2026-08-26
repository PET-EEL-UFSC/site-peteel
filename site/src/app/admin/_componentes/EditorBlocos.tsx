'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Blocos, Bloco } from '@/lib/content/blocos'
import { salvarRascunho, publicar, descartarRascunho } from '../acoes'
import { FormBloco, ROTULOS_BLOCO } from './FormBloco'
import type { OpcaoMidia } from './EscolhaFoto'
import { Previa } from './Previa'

type Props = {
  paginaId: string
  slug: string
  titulo: string
  inicial: Blocos
  temRascunho: boolean
  podePublicar: boolean
  midias: OpcaoMidia[]
}

const TIPOS_NOVOS: Bloco['tipo'][] = ['faixa', 'cabecalho', 'equipe', 'mapa', 'hero']

function blocoNovo(tipo: Bloco['tipo']): Bloco {
  const id = crypto.randomUUID()
  switch (tipo) {
    case 'faixa':
      return { id, tipo, fundo: 'offwhite', layout: '1', alinhamento: 'start', espacamento: 'normal', decor: null, quadrantes: [[{ tipo: 'titulo', texto: 'Novo título', tamanho: 'g' }]] }
    case 'cabecalho':
      return { id, tipo, migalha: 'Seção', titulo: 'Título da página', fundo: 'amarelo', decor: null }
    case 'equipe':
      return { id, tipo, mostrarTutor: true, limite: null }
    case 'mapa':
      return { id, tipo }
    case 'hero':
      return { id, tipo, chapeu: 'Chapéu', titulo: 'Manchete', texto: '', botoes: [], fotos: [] }
  }
}

/** Resumo do bloco na lista lateral, para dar a ver o que é sem abrir. */
function resumo(b: Bloco): string {
  switch (b.tipo) {
    case 'hero': return b.titulo
    case 'cabecalho': return b.titulo
    case 'equipe': return b.titulo ?? 'Grade de petianos'
    case 'mapa': return 'Gerado automaticamente'
    case 'faixa': {
      const t = b.quadrantes.flat().find((e) => e.tipo === 'titulo')
      if (t && t.tipo === 'titulo') return t.texto
      const n = b.quadrantes.flat().length
      return n ? `${n} conteúdo(s)` : 'vazia'
    }
  }
}

export function EditorBlocos({ paginaId, slug, titulo, inicial, temRascunho, podePublicar, midias }: Props) {
  const [blocos, setBlocos] = useState<Blocos>(inicial)
  const [sel, setSel] = useState(0)
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [sujo, setSujo] = useState(false)
  const [pendente, iniciar] = useTransition()

  const atual = blocos[sel]

  const alterar = (novos: Blocos) => {
    setBlocos(novos)
    setSujo(true)
    setMsg(null)
  }

  const mover = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= blocos.length) return
    const c = [...blocos]
    ;[c[i], c[j]] = [c[j], c[i]]
    alterar(c)
    setSel(j)
  }

  const remover = (i: number) => {
    if (!confirm(`Remover o bloco "${ROTULOS_BLOCO[blocos[i].tipo]}"?`)) return
    alterar(blocos.filter((_, k) => k !== i))
    setSel((s) => Math.max(0, Math.min(s, blocos.length - 2)))
  }

  const executar = (fn: () => Promise<{ ok: true; mensagem: string } | { ok: false; erro: string }>) =>
    iniciar(async () => {
      const r = await fn()
      if (r.ok) {
        setMsg({ ok: true, texto: r.mensagem })
        setSujo(false)
      } else {
        setMsg({ ok: false, texto: r.erro })
      }
    })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
        <Link href="/admin" style={{ font: '400 13px var(--corpo)' }}>← Páginas</Link>
        <h1 style={{ fontSize: 30, lineHeight: 1, textTransform: 'uppercase' }}>{titulo}</h1>
        <span style={{ font: '400 13px var(--condensada)', color: 'rgba(44,43,34,0.55)' }}>{slug}</span>
        <a href={slug} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', font: '400 13px var(--corpo)' }}>
          Ver no site ↗
        </a>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '14px 0 18px' }}>
        <button className="btn btn-claro" disabled={pendente} onClick={() => executar(() => salvarRascunho(paginaId, blocos))}>
          {pendente ? 'Salvando…' : 'Salvar rascunho'}
        </button>
        {podePublicar && (
          <button className="btn" disabled={pendente} onClick={() => executar(() => publicar(paginaId, blocos))}>
            Publicar
          </button>
        )}
        {temRascunho && (
          <button className="btn btn-claro" disabled={pendente} onClick={() => { if (confirm('Descartar o rascunho e voltar ao que está no ar?')) executar(() => descartarRascunho(paginaId)) }}>
            Descartar rascunho
          </button>
        )}
        {sujo && <span style={{ font: '400 13px var(--corpo)', color: '#a11' }}>alterações não salvas</span>}
        {!podePublicar && <span className="dica">Você pode salvar rascunho; publicar é só para administradores.</span>}
      </div>

      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}

      <div className="editor">
        <div>
          {blocos.map((b, i) => (
            <div key={b.id} className="bloco-item" data-sel={i === sel ? '1' : '0'} onClick={() => setSel(i)}>
              <span className="rotulo">
                {ROTULOS_BLOCO[b.tipo]}
                <br />
                <span style={{ font: '400 11.5px var(--corpo)', color: 'rgba(44,43,34,0.6)', textTransform: 'none', letterSpacing: 0 }}>{resumo(b)}</span>
              </span>
              <button type="button" className="mini" title="Subir" disabled={i === 0} onClick={(e) => { e.stopPropagation(); mover(i, -1) }}>↑</button>
              <button type="button" className="mini" title="Descer" disabled={i === blocos.length - 1} onClick={(e) => { e.stopPropagation(); mover(i, 1) }}>↓</button>
              <button type="button" className="mini" title="Remover" onClick={(e) => { e.stopPropagation(); remover(i) }}>×</button>
            </div>
          ))}

          <select
            value=""
            onChange={(e) => {
              const t = e.target.value as Bloco['tipo']
              if (!t) return
              alterar([...blocos, blocoNovo(t)])
              setSel(blocos.length)
              e.target.value = ''
            }}
            style={{ width: '100%', border: '2px dashed var(--escuro)', background: '#fff', padding: '10px 11px', font: '700 13px var(--corpo)', cursor: 'pointer' }}
          >
            <option value="">+ Adicionar bloco…</option>
            {TIPOS_NOVOS.map((t) => (
              <option key={t} value={t}>{ROTULOS_BLOCO[t]}</option>
            ))}
          </select>
        </div>

        <div className="cartao" style={{ padding: '20px 22px' }}>
          {!atual ? (
            <p className="dica">Esta página não tem blocos. Adicione um ao lado.</p>
          ) : (
            <>
              <h2 style={{ fontSize: 20, textTransform: 'uppercase', marginBottom: 16 }}>{ROTULOS_BLOCO[atual.tipo]}</h2>
              <FormBloco bloco={atual} midias={midias} onChange={(b) => alterar(blocos.map((o, k) => (k === sel ? b : o)))} />
            </>
          )}
        </div>

        <Previa paginaId={paginaId} blocos={blocos} selecionado={atual?.id} />
      </div>
    </>
  )
}
