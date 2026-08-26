'use client'

import type { Bloco, Decor } from '@/lib/content/blocos'
import { LAYOUTS } from '@/lib/content/blocos'
import type { Elemento } from '@/lib/content/elementos'
import { Texto, Area, Selecao, Alternador, EscolhaCor, Secao } from './campos'
import { EscolhaFoto, type OpcaoMidia } from './EscolhaFoto'
import { FormElemento, ROTULOS, novoElemento } from './FormElemento'

export const ROTULOS_BLOCO: Record<Bloco['tipo'], string> = {
  hero: 'Topo da home',
  cabecalho: 'Cabeçalho da página',
  faixa: 'Faixa',
  equipe: 'Equipe',
  mapa: 'Mapa do site',
}

const TIPOS_ELEMENTO = Object.keys(ROTULOS) as Elemento['tipo'][]

function FormDecor({ decor, onChange }: { decor: Decor | null; onChange: (d: Decor | null) => void }) {
  return (
    <Secao titulo="Raio decorativo">
      <Alternador
        rotulo="Mostrar raio"
        valor={!!decor}
        onChange={(v) => onChange(v ? { tipo: 'raio', cor: 'amarelo', lado: 'direita', tamanho: 'medio', sangra: false, opacidade: 0.9 } : null)}
      />
      {decor && (
        <>
          <EscolhaCor rotulo="Cor do raio" valor={decor.cor} onChange={(cor) => cor && onChange({ ...decor, cor })} />
          <Selecao rotulo="Lado" valor={decor.lado} opcoes={[['esquerda', 'Esquerda'], ['direita', 'Direita']]} onChange={(lado) => onChange({ ...decor, lado })} />
          <Selecao rotulo="Tamanho" valor={decor.tamanho} opcoes={[['pequeno', 'Pequeno'], ['medio', 'Médio'], ['gigante', 'Gigante']]} onChange={(tamanho) => onChange({ ...decor, tamanho })} />
          <Alternador rotulo="Corta na borda da faixa" valor={decor.sangra} onChange={(sangra) => onChange({ ...decor, sangra })} />
          <label className="campo">
            <span>Transparência ({Math.round(decor.opacidade * 100)}%)</span>
            <input type="range" min={10} max={100} value={Math.round(decor.opacidade * 100)} onChange={(e) => onChange({ ...decor, opacidade: Number(e.target.value) / 100 })} style={{ width: '100%' }} />
          </label>
          <p className="dica" style={{ marginBottom: 10 }}>O texto se afasta do raio automaticamente — não precisa ajustar espaçamento.</p>
        </>
      )}
    </Secao>
  )
}

export function FormBloco({ bloco, onChange, midias }: { bloco: Bloco; onChange: (b: Bloco) => void; midias: OpcaoMidia[] }) {
  if (bloco.tipo === 'mapa') {
    return <p className="dica">O mapa é montado sozinho a partir das páginas do site. Não há nada para editar aqui.</p>
  }

  if (bloco.tipo === 'equipe') {
    return (
      <>
        <Texto rotulo="Título (opcional)" valor={bloco.titulo ?? ''} onChange={(titulo) => onChange({ ...bloco, titulo: titulo || undefined })} />
        <Alternador rotulo="Mostrar o tutor em destaque" valor={bloco.mostrarTutor} onChange={(mostrarTutor) => onChange({ ...bloco, mostrarTutor })} />
        <label className="campo">
          <span>Quantos petianos mostrar</span>
          <input type="number" min={1} max={40} value={bloco.limite ?? ''} placeholder="todos" onChange={(e) => onChange({ ...bloco, limite: e.target.value ? Number(e.target.value) : null })} />
          <p className="dica">Deixe vazio para mostrar todos. As pessoas vêm da aba Pessoas.</p>
        </label>
      </>
    )
  }

  if (bloco.tipo === 'cabecalho') {
    return (
      <>
        <Texto rotulo="Caminho" valor={bloco.migalha} onChange={(migalha) => onChange({ ...bloco, migalha })} dica="Ex: Pesquisa / Projetos internos" />
        <Area rotulo="Título" valor={bloco.titulo} onChange={(titulo) => onChange({ ...bloco, titulo })} />
        <Area rotulo="Texto de apoio" valor={bloco.texto ?? ''} onChange={(texto) => onChange({ ...bloco, texto: texto || undefined })} />
        <EscolhaCor rotulo="Cor de fundo" valor={bloco.fundo} onChange={(fundo) => fundo && onChange({ ...bloco, fundo })} />
        <p className="dica" style={{ marginTop: -8, marginBottom: 12 }}>A cor do texto se ajusta sozinha ao fundo.</p>
        <FormDecor decor={bloco.decor} onChange={(decor) => onChange({ ...bloco, decor })} />
      </>
    )
  }

  if (bloco.tipo === 'hero') {
    return (
      <>
        <Texto rotulo="Chapéu" valor={bloco.chapeu} onChange={(chapeu) => onChange({ ...bloco, chapeu })} />
        <Area rotulo="Manchete" valor={bloco.titulo} onChange={(titulo) => onChange({ ...bloco, titulo })} />
        <Area rotulo="Texto" valor={bloco.texto} onChange={(texto) => onChange({ ...bloco, texto })} />
        <Secao titulo="Botões">
          {bloco.botoes.map((b, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(44,43,34,0.15)', marginBottom: 10 }}>
              <Texto rotulo={`Botão ${i + 1} — texto`} valor={b.texto} onChange={(texto) => onChange({ ...bloco, botoes: bloco.botoes.map((o, k) => (k === i ? { ...o, texto } : o)) })} />
              <Texto rotulo="Link" valor={b.href} onChange={(href) => onChange({ ...bloco, botoes: bloco.botoes.map((o, k) => (k === i ? { ...o, href } : o)) })} />
            </div>
          ))}
        </Secao>
        <Secao titulo="Fotos do topo">
          {[0, 1, 2].map((i) => (
            <EscolhaFoto
              key={i}
              rotulo={i === 0 ? 'Foto principal' : `Foto secundária ${i}`}
              valor={bloco.fotos[i] ?? { midiaId: null, legenda: '' }}
              midias={midias}
              onChange={(f) => {
                const fotos = [...bloco.fotos]
                while (fotos.length < 3) fotos.push({ midiaId: null, legenda: '' })
                fotos[i] = f
                onChange({ ...bloco, fotos })
              }}
            />
          ))}
        </Secao>
      </>
    )
  }

  // ── faixa ──
  const nQuadrantes = LAYOUTS[bloco.layout]

  return (
    <>
      <EscolhaCor rotulo="Cor de fundo" valor={bloco.fundo} onChange={(fundo) => fundo && onChange({ ...bloco, fundo })} />
      <EscolhaCor rotulo="Cor de destaque" valor={bloco.acento} permitirNenhuma onChange={(acento) => onChange({ ...bloco, acento })} />
      <p className="dica" style={{ marginTop: -8, marginBottom: 12 }}>Usada nos títulos de lista e nos botões preenchidos. A cor do texto se ajusta sozinha ao fundo.</p>

      <Selecao
        rotulo="Divisão em quadrantes"
        valor={bloco.layout}
        opcoes={[['1', '1 quadrante'], ['2', '2 quadrantes iguais'], ['2-60/40', '2 quadrantes (60% / 40%)'], ['3', '3 quadrantes'], ['2x2', '4 quadrantes (2 × 2)']]}
        onChange={(layout) => {
          const alvo = LAYOUTS[layout]
          const q = [...bloco.quadrantes]
          while (q.length < alvo) q.push([])
          onChange({ ...bloco, layout, quadrantes: q.slice(0, alvo) })
        }}
      />
      <Selecao rotulo="Alinhamento vertical" valor={bloco.alinhamento} opcoes={[['start', 'Topo'], ['center', 'Centro']]} onChange={(alinhamento) => onChange({ ...bloco, alinhamento })} />
      <Selecao rotulo="Espaçamento" valor={bloco.espacamento} opcoes={[['compacto', 'Compacto'], ['normal', 'Normal'], ['amplo', 'Amplo']]} onChange={(espacamento) => onChange({ ...bloco, espacamento })} />

      <FormDecor decor={bloco.decor} onChange={(decor) => onChange({ ...bloco, decor })} />

      {Array.from({ length: nQuadrantes }, (_, qi) => {
        const conteudo = bloco.quadrantes[qi] ?? []
        const setQuad = (novo: Elemento[]) =>
          onChange({ ...bloco, quadrantes: bloco.quadrantes.map((o, k) => (k === qi ? novo : o)) })

        return (
          <Secao key={qi} titulo={`Quadrante ${qi + 1}`}>
            {conteudo.length === 0 && <p className="dica" style={{ marginBottom: 10 }}>Vazio. Adicione conteúdo abaixo.</p>}

            {conteudo.map((el, ei) => (
              <details key={ei} style={{ border: '2px solid rgba(44,43,34,0.25)', marginBottom: 10, background: '#fbfbf8' }}>
                <summary style={{ padding: '9px 12px', cursor: 'pointer', font: '900 12px var(--condensada)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1 }}>{ROTULOS[el.tipo]}</span>
                  <button type="button" className="mini" title="Subir" onClick={(e) => { e.preventDefault(); if (ei === 0) return; const c = [...conteudo]; [c[ei - 1], c[ei]] = [c[ei], c[ei - 1]]; setQuad(c) }} disabled={ei === 0}>↑</button>
                  <button type="button" className="mini" title="Descer" onClick={(e) => { e.preventDefault(); if (ei === conteudo.length - 1) return; const c = [...conteudo]; [c[ei + 1], c[ei]] = [c[ei], c[ei + 1]]; setQuad(c) }} disabled={ei === conteudo.length - 1}>↓</button>
                  <button type="button" className="mini" title="Remover" onClick={(e) => { e.preventDefault(); setQuad(conteudo.filter((_, k) => k !== ei)) }}>×</button>
                </summary>
                <div style={{ padding: '4px 12px 2px' }}>
                  <FormElemento el={el} midias={midias} onChange={(novo) => setQuad(conteudo.map((o, k) => (k === ei ? novo : o)))} />
                </div>
              </details>
            ))}

            <select
              value=""
              onChange={(e) => {
                const t = e.target.value as Elemento['tipo']
                if (t) setQuad([...conteudo, novoElemento(t)])
                e.target.value = ''
              }}
              style={{ width: '100%', border: '2px dashed var(--escuro)', background: '#fff', padding: '9px 11px', font: '700 13px var(--corpo)', marginBottom: 12, cursor: 'pointer' }}
            >
              <option value="">+ Adicionar conteúdo neste quadrante…</option>
              {TIPOS_ELEMENTO.map((t) => (
                <option key={t} value={t}>{ROTULOS[t]}</option>
              ))}
            </select>
          </Secao>
        )
      })}
    </>
  )
}
