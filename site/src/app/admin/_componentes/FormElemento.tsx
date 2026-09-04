'use client'

import type { Elemento, FotoRef } from '@/lib/content/elementos'
import type { Cor } from '@/lib/content/cores'
import { Texto, Area, Selecao, Alternador, EscolhaCor, Secao } from './campos'
import { EscolhaFoto, type OpcaoMidia } from './EscolhaFoto'

export const ROTULOS: Record<Elemento['tipo'], string> = {
  chip: 'Etiqueta',
  titulo: 'Título',
  paragrafo: 'Parágrafo',
  botoes: 'Botões',
  lista: 'Lista',
  foto: 'Foto',
  galeria: 'Galeria de fotos',
  cards: 'Cards',
  linhas: 'Lista com miniaturas',
  embed: 'Vídeo / player',
}

const FOTO_VAZIA: FotoRef = { midiaId: null, legenda: '' }

export function novoElemento(tipo: Elemento['tipo']): Elemento {
  switch (tipo) {
    case 'chip': return { tipo, texto: 'Etiqueta', estilo: 'solido', inclinado: false }
    case 'titulo': return { tipo, texto: 'Novo título', tamanho: 'g' }
    case 'paragrafo': return { tipo, texto: 'Escreva aqui.' }
    case 'botoes': return { tipo, itens: [{ texto: 'Saiba mais', href: '/', variante: 'solido' }] }
    case 'lista': return { tipo, itens: [{ titulo: 'Item', texto: 'Descrição do item.' }] }
    case 'foto': return { tipo, foto: { ...FOTO_VAZIA }, proporcao: '4/3' }
    case 'galeria': return { tipo, itens: [{ ...FOTO_VAZIA }, { ...FOTO_VAZIA }], colunas: 2, proporcao: '1/1', destaque: false }
    case 'cards': return { tipo, itens: [{ titulo: 'Card', texto: '' }], colunas: 3 }
    case 'linhas': return { tipo, itens: [{ rotulo: 'Rótulo', titulo: 'Item', texto: '' }], comFoto: true, tamanhoRotulo: 'p' }
    case 'embed': return { tipo, provedor: 'youtube', url: 'https://www.youtube.com/watch?v=' }
  }
}

type Props = { el: Elemento; onChange: (e: Elemento) => void; midias: OpcaoMidia[] }

/** Lista editável genérica: adicionar, remover e reordenar itens. */
function ListaItens<T>({ itens, onChange, novo, render, max = 12 }: { itens: T[]; onChange: (v: T[]) => void; novo: () => T; render: (item: T, set: (v: T) => void) => React.ReactNode; max?: number }) {
  const mover = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= itens.length) return
    const c = [...itens]
    ;[c[i], c[j]] = [c[j], c[i]]
    onChange(c)
  }

  return (
    <>
      {itens.map((item, i) => (
        <div key={i} style={{ border: '1px solid rgba(44,43,34,0.25)', padding: '12px 12px 2px', marginBottom: 10, background: '#fbfbf8' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 8 }}>
            <button type="button" className="mini" onClick={() => mover(i, -1)} disabled={i === 0} title="Subir">↑</button>
            <button type="button" className="mini" onClick={() => mover(i, 1)} disabled={i === itens.length - 1} title="Descer">↓</button>
            <button type="button" className="mini" onClick={() => onChange(itens.filter((_, k) => k !== i))} title="Remover">×</button>
          </div>
          {render(item, (v) => onChange(itens.map((o, k) => (k === i ? v : o))))}
        </div>
      ))}
      {itens.length < max && (
        <button type="button" className="btn btn-claro" style={{ marginBottom: 12 }} onClick={() => onChange([...itens, novo()])}>
          + Adicionar
        </button>
      )}
    </>
  )
}

export function FormElemento({ el, onChange, midias }: Props) {
  switch (el.tipo) {
    case 'chip':
      return (
        <>
          <Texto rotulo="Texto" valor={el.texto} onChange={(texto) => onChange({ ...el, texto })} />
          <Selecao rotulo="Estilo" valor={el.estilo} opcoes={[['solido', 'Preenchida'], ['contorno', 'Só contorno']]} onChange={(estilo) => onChange({ ...el, estilo })} />
          <EscolhaCor rotulo="Cor" valor={el.cor} permitirNenhuma onChange={(cor) => onChange({ ...el, cor })} />
          <Alternador rotulo="Levemente inclinada" valor={el.inclinado} onChange={(inclinado) => onChange({ ...el, inclinado })} />
        </>
      )

    case 'titulo':
      return (
        <>
          <Area rotulo="Texto" valor={el.texto} onChange={(texto) => onChange({ ...el, texto })} />
          <Selecao rotulo="Tamanho" valor={el.tamanho} opcoes={[['g', 'Grande'], ['m', 'Médio'], ['p', 'Pequeno']]} onChange={(tamanho) => onChange({ ...el, tamanho })} />
        </>
      )

    case 'paragrafo':
      return <Area rotulo="Texto" valor={el.texto} onChange={(texto) => onChange({ ...el, texto })} />

    case 'botoes':
      return (
        <Secao titulo="Botões">
          <ListaItens
            itens={el.itens}
            max={3}
            novo={() => ({ texto: 'Botão', href: '/', variante: 'solido' as const })}
            onChange={(itens) => onChange({ ...el, itens })}
            render={(b, set) => (
              <>
                <Texto rotulo="Texto" valor={b.texto} onChange={(texto) => set({ ...b, texto })} />
                <Texto rotulo="Link" valor={b.href} onChange={(href) => set({ ...b, href })} dica="Ex: /pesquisa ou https://…" />
                <Selecao rotulo="Estilo" valor={b.variante} opcoes={[['solido', 'Preenchido'], ['contorno', 'Só contorno']]} onChange={(variante) => set({ ...b, variante })} />
              </>
            )}
          />
          <p className="dica" style={{ marginBottom: 10 }}>Máximo de 3 — mais que isso quebra o layout.</p>
        </Secao>
      )

    case 'lista':
      return (
        <Secao titulo="Itens da lista">
          <ListaItens
            itens={el.itens}
            max={8}
            novo={() => ({ titulo: 'Item', texto: '' })}
            onChange={(itens) => onChange({ ...el, itens })}
            render={(it, set) => (
              <>
                <Texto rotulo="Título" valor={it.titulo} onChange={(titulo) => set({ ...it, titulo })} />
                <Area rotulo="Descrição" valor={it.texto} onChange={(texto) => set({ ...it, texto })} />
              </>
            )}
          />
        </Secao>
      )

    case 'foto':
      return (
        <>
          <EscolhaFoto rotulo="Imagem" valor={el.foto} midias={midias} onChange={(foto) => onChange({ ...el, foto })} />
          <Selecao rotulo="Formato" valor={el.proporcao} opcoes={[['4/3', 'Paisagem 4:3'], ['16/10', 'Paisagem larga'], ['3/2', 'Paisagem 3:2'], ['1/1', 'Quadrada'], ['4/5', 'Retrato']]} onChange={(proporcao) => onChange({ ...el, proporcao })} />
        </>
      )

    case 'galeria':
      return (
        <>
          <Selecao rotulo="Colunas" valor={el.colunas} opcoes={[[2, '2 colunas'], [3, '3 colunas'], [4, '4 colunas']]} onChange={(colunas) => onChange({ ...el, colunas })} />
          <Selecao rotulo="Formato" valor={el.proporcao} opcoes={[['1/1', 'Quadrada'], ['4/3', 'Paisagem'], ['4/5', 'Retrato']]} onChange={(proporcao) => onChange({ ...el, proporcao })} />
          <Alternador rotulo="Primeira foto em destaque" valor={el.destaque} dica="Ocupa o dobro de largura e altura, formando um mosaico." onChange={(destaque) => onChange({ ...el, destaque })} />
          <Secao titulo="Fotos">
            <ListaItens
              itens={el.itens}
              novo={() => ({ ...FOTO_VAZIA })}
              onChange={(itens) => onChange({ ...el, itens })}
              render={(f, set) => <EscolhaFoto rotulo="Imagem" valor={f} midias={midias} onChange={set} />}
            />
          </Secao>
        </>
      )

    case 'cards':
      return (
        <>
          <Selecao rotulo="Colunas" valor={el.colunas} opcoes={[[2, '2 colunas'], [3, '3 colunas'], [4, '4 colunas']]} onChange={(colunas) => onChange({ ...el, colunas })} />
          <Secao titulo="Cards">
            <ListaItens
              itens={el.itens}
              novo={() => ({ titulo: 'Card', texto: '' })}
              onChange={(itens) => onChange({ ...el, itens })}
              render={(c, set) => (
                <>
                  <Texto rotulo="Título" valor={c.titulo} onChange={(titulo) => set({ ...c, titulo })} />
                  <Area rotulo="Texto" valor={c.texto ?? ''} onChange={(texto) => set({ ...c, texto })} />
                  <Texto rotulo="Etiqueta" valor={c.tag ?? ''} onChange={(tag) => set({ ...c, tag: tag || undefined })} dica="Opcional. Ex: Concluído, Em curso." />
                  <EscolhaCor rotulo="Cor da etiqueta" valor={c.corTag as Cor | undefined} permitirNenhuma onChange={(corTag) => set({ ...c, corTag })} />
                  <Texto rotulo="Link" valor={c.href ?? ''} onChange={(href) => set({ ...c, href: href || undefined })} dica="Opcional." />
                  <EscolhaFoto rotulo="Foto" valor={c.foto ?? { ...FOTO_VAZIA }} midias={midias} onChange={(foto) => set({ ...c, foto })} />
                </>
              )}
            />
          </Secao>
        </>
      )

    case 'linhas':
      return (
        <>
          <Alternador rotulo="Mostrar miniatura em cada linha" valor={el.comFoto} onChange={(comFoto) => onChange({ ...el, comFoto })} />
          <Selecao
            rotulo="Tamanho do rótulo"
            valor={el.tamanhoRotulo}
            opcoes={[['p', 'Pequeno'], ['m', 'Médio'], ['g', 'Grande']]}
            onChange={(tamanhoRotulo) => onChange({ ...el, tamanhoRotulo })}
          />
          <Secao titulo="Linhas">
            <ListaItens
              itens={el.itens}
              max={30}
              novo={() => ({ rotulo: '', titulo: 'Item', texto: '' })}
              onChange={(itens) => onChange({ ...el, itens })}
              render={(it, set) => (
                <>
                  <Texto rotulo="Rótulo" valor={it.rotulo} onChange={(rotulo) => set({ ...it, rotulo })} dica="Ex: Sex · 12h10, Ep. 03, 2024" />
                  <Texto rotulo="Título" valor={it.titulo} onChange={(titulo) => set({ ...it, titulo })} />
                  <Area rotulo="Descrição" valor={it.texto ?? ''} onChange={(texto) => set({ ...it, texto })} />
                  <Texto rotulo="Link" valor={it.href ?? ''} onChange={(href) => set({ ...it, href: href || undefined })} dica="Opcional." />
                  {el.comFoto && <EscolhaFoto rotulo="Miniatura" valor={it.foto ?? { ...FOTO_VAZIA }} midias={midias} onChange={(foto) => set({ ...it, foto })} />}
                </>
              )}
            />
          </Secao>
        </>
      )

    case 'embed':
      return (
        <>
          <Selecao rotulo="Onde está" valor={el.provedor} opcoes={[['youtube', 'YouTube'], ['spotify', 'Spotify']]} onChange={(provedor) => onChange({ ...el, provedor })} />
          <Texto rotulo="Endereço" valor={el.url} onChange={(url) => onChange({ ...el, url })} dica="Cole o link normal do vídeo ou do episódio." />
          <Texto rotulo="Descrição para leitores de tela" valor={el.titulo ?? ''} onChange={(titulo) => onChange({ ...el, titulo: titulo || undefined })} />
        </>
      )
  }
}
