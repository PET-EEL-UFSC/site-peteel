import Link from 'next/link'
import { hexDe, fundoDe, fundoEscuro, type Cor } from '@/lib/content/cores'
import type { Elemento } from '@/lib/content/elementos'
import type { MapaMidia } from '@/lib/content/midia'
import { Foto } from '@/components/Foto'

export type Ctx = {
  /** o fundo da faixa é escuro? define a cor do texto */
  escuro: boolean
  acento: Cor
  midias: MapaMidia
}

const cond = "var(--condensada)"
const corpo = 'var(--corpo)'

const TAMANHOS_ROTULO = { p: '12px', m: '15px', g: '18px' } as const

function Chip({ el, ctx }: { el: Extract<Elemento, { tipo: 'chip' }>; ctx: Ctx }) {
  const cor = el.cor ?? (ctx.escuro ? 'amarelo' : 'escuro')
  const solido = el.estilo !== 'contorno'
  return (
    <span
      style={{
        display: 'inline-block',
        ...(solido
          ? { background: fundoDe(cor), color: fundoEscuro(cor) ? '#F9F9F9' : '#2C2B22' }
          // contorno é borda + texto: CSS não aceita gradiente aí, cai pra cor sólida representativa
          : { border: `2px solid ${hexDe(cor)}`, color: hexDe(cor) }),
        padding: '6px 12px',
        font: `900 11px/1 ${cond}`,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        ...(el.inclinado ? { transform: 'rotate(-1.4deg)' } : {}),
      }}
    >
      {el.texto}
    </span>
  )
}

function Botoes({ el, ctx }: { el: Extract<Elemento, { tipo: 'botoes' }>; ctx: Ctx }) {
  const contraste = ctx.escuro ? '#F9F9F9' : '#2C2B22'
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
      {el.itens.map((b, i) => {
        return (
          <Link
            key={i}
            href={b.href}
            style={
              b.variante === 'contorno'
                ? {
                    border: `2px solid ${contraste}`,
                    color: contraste,
                    padding: '13px 24px',
                    font: `900 13px/1 ${cond}`,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }
                : {
                    background: fundoDe(ctx.acento),
                    color: fundoEscuro(ctx.acento) ? '#F9F9F9' : '#2C2B22',
                    padding: '15px 26px',
                    font: `900 13px/1 ${cond}`,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }
            }
          >
            {b.texto}
          </Link>
        )
      })}
    </div>
  )
}

export function RenderElemento({ el, ctx }: { el: Elemento; ctx: Ctx }) {
  const texto = ctx.escuro ? '#F9F9F9' : '#2C2B22'
  const textoFraco = ctx.escuro ? 'rgba(249,249,249,0.82)' : '#2C2B22'
  const linha = ctx.escuro ? 'rgba(249,249,249,0.25)' : 'rgba(44,43,34,0.25)'

  switch (el.tipo) {
    case 'chip':
      return <Chip el={el} ctx={ctx} />

    case 'titulo': {
      const tam = { p: '26px', m: '34px', g: 'clamp(30px,3.6vw,48px)' }[el.tamanho]
      return (
        <h2 style={{ marginTop: 16, fontSize: tam, lineHeight: 1, textTransform: 'uppercase', maxWidth: '16ch', color: texto }}>
          {el.texto}
        </h2>
      )
    }

    case 'paragrafo':
      return <p style={{ marginTop: 14, maxWidth: '52ch', font: `400 16px/1.6 ${corpo}`, color: textoFraco }}>{el.texto}</p>

    case 'botoes':
      return <Botoes el={el} ctx={ctx} />

    case 'lista':
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {el.itens.map((it, i) => (
            <div key={i} style={{ padding: '16px 0', borderTop: `1px solid ${linha}` }}>
              <h3 style={{ font: `900 18px/1 ${cond}`, textTransform: 'uppercase', color: hexDe(ctx.acento) }}>{it.titulo}</h3>
              <p style={{ marginTop: 7, font: `400 14.5px/1.55 ${corpo}`, color: textoFraco }}>{it.texto}</p>
            </div>
          ))}
        </div>
      )

    case 'foto':
      return (
        <Foto
          midiaId={el.foto.midiaId}
          legenda={el.foto.legenda}
          midias={ctx.midias}
          proporcao={el.proporcao}
          style={{ border: `3px solid ${ctx.escuro ? '#F9F9F9' : '#2C2B22'}` }}
        />
      )

    case 'galeria':
      return (
        <div
          className="grid-galeria"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${el.colunas},1fr)`, gap: 12 }}
        >
          {el.itens.map((f, i) => (
            <Foto
              key={i}
              midiaId={f.midiaId}
              legenda={f.legenda}
              midias={ctx.midias}
              proporcao={el.destaque && i === 0 ? null : el.proporcao}
              style={{
                border: `2px solid ${ctx.escuro ? '#F9F9F9' : '#2C2B22'}`,
                ...(el.destaque && i === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : {}),
              }}
            />
          ))}
        </div>
      )

    case 'cards':
      return (
        <div
          className="grid-cards"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${el.colunas},minmax(0,1fr))`, gap: 18 }}
        >
          {el.itens.map((c, i) => {
            const Wrapper = (c.href ? Link : 'div') as React.ElementType
            const tagCor = c.corTag ?? 'amarelo'
            return (
              <Wrapper
                key={i}
                {...(c.href ? { href: c.href } : {})}
                style={{
                  position: 'relative',
                  background: '#fff',
                  color: '#2C2B22',
                  border: '2px solid #2C2B22',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {c.foto && (
                  <Foto midiaId={c.foto.midiaId} legenda={c.foto.legenda} midias={ctx.midias} proporcao="4/3" style={{ borderBottom: '2px solid #2C2B22' }} />
                )}
                <div style={{ padding: '20px 20px 22px' }}>
                  {c.tag && (
                    <span
                      style={{
                        display: 'inline-block',
                        background: fundoDe(tagCor),
                        color: fundoEscuro(tagCor) ? '#F9F9F9' : '#2C2B22',
                        padding: '5px 10px',
                        font: `900 10.5px/1 ${cond}`,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {c.tag}
                    </span>
                  )}
                  <h3 style={{ marginTop: 12, font: `900 22px/1.05 ${cond}`, textTransform: 'uppercase' }}>{c.titulo}</h3>
                  {c.texto && <p style={{ marginTop: 9, font: `400 14.5px/1.55 ${corpo}` }}>{c.texto}</p>}
                </div>
                <span style={{ position: 'absolute', top: 0, right: 0, width: 44, height: 44, background: fundoDe(tagCor), clipPath: 'polygon(100% 0,100% 100%,0 0)' }} />
              </Wrapper>
            )
          })}
        </div>
      )

    case 'linhas':
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {el.itens.map((it, i) => {
            const Wrapper = (it.href ? Link : 'div') as React.ElementType
            return (
              <Wrapper
                key={i}
                {...(it.href ? { href: it.href } : {})}
                className={el.comFoto ? 'linha-com-foto' : undefined}
                style={{
                  display: 'grid',
                  gridTemplateColumns: el.comFoto ? '150px 96px 1fr' : '96px 1fr',
                  gap: 20,
                  padding: '18px 0',
                  borderTop: `2px solid ${linha}`,
                  color: texto,
                  alignItems: 'start',
                }}
              >
                {el.comFoto && (
                  <Foto
                    className="linha-foto"
                    midiaId={it.foto?.midiaId}
                    legenda={it.foto?.legenda}
                    midias={ctx.midias}
                    proporcao="4/3"
                    style={{ border: `2px solid ${ctx.escuro ? '#F9F9F9' : '#2C2B22'}` }}
                  />
                )}
                <span style={{ font: `900 ${TAMANHOS_ROTULO[el.tamanhoRotulo]}/1.4 ${cond}`, letterSpacing: '0.12em', textTransform: 'uppercase', color: hexDe(ctx.acento), paddingTop: 4 }}>
                  {it.rotulo}
                </span>
                <div>
                  <h3 style={{ font: `900 21px/1.1 ${cond}`, textTransform: 'uppercase', color: texto }}>{it.titulo}</h3>
                  {it.texto && <p style={{ marginTop: 7, maxWidth: '64ch', font: `400 14.5px/1.55 ${corpo}`, color: textoFraco }}>{it.texto}</p>}
                </div>
              </Wrapper>
            )
          })}
        </div>
      )

    case 'embed': {
      const src =
        el.provedor === 'youtube'
          ? el.url.replace('watch?v=', 'embed/')
          : el.url.replace('/track/', '/embed/track/').replace('/episode/', '/embed/episode/')
      return (
        <div style={{ position: 'relative', aspectRatio: el.provedor === 'youtube' ? '16/9' : '16/6', border: `3px solid ${ctx.escuro ? '#F9F9F9' : '#2C2B22'}` }}>
          <iframe
            src={src}
            title={el.titulo ?? 'mídia incorporada'}
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      )
    }
  }
}
