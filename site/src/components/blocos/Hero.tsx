import Link from 'next/link'
import type { Bloco } from '@/lib/content/blocos'
import type { MapaMidia } from '@/lib/content/midia'
import { Foto } from '@/components/Foto'

type HeroT = Extract<Bloco, { tipo: 'hero' }>

export function Hero({ bloco, midias }: { bloco: HeroT; midias: MapaMidia }) {
  const [f1, f2, f3] = bloco.fotos
  return (
    <section
      className="hero-secao"
      style={{
        position: 'relative',
        background: 'var(--amarelo)',
        overflow: 'hidden',
        // teto de 900px: em monitor alto um hero de 100vh vira uma
        // parede vazia antes do primeiro conteúdo
        minHeight: 'min(100svh, 900px)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '56%',
          height: '100%',
          background: 'var(--offwhite)',
          clipPath: 'polygon(46% 0,100% 0,100% 100%,0 100%,38% 52%,10% 52%)',
          animation: 'boltshift 14s ease-in-out infinite alternate',
        }}
      />

      <div
        className="hero"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1280,
          margin: '0 auto',
          padding: '96px 28px 44px',
          display: 'grid',
          gridTemplateColumns: '1.02fr 0.98fr',
          gap: 44,
          alignItems: 'center',
        }}
      >
        <div>
          <p style={{ font: "700 12px/1 var(--condensada)", letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            {bloco.chapeu}
          </p>
          <h1 style={{ marginTop: 20, fontSize: 'clamp(40px,4.9vw,78px)', lineHeight: 0.92, textTransform: 'uppercase', maxWidth: '12ch', textWrap: 'balance' }}>
            {bloco.titulo}
          </h1>
          <p style={{ marginTop: 20, maxWidth: '42ch', font: '400 17px/1.5 var(--corpo)' }}>{bloco.texto}</p>

          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            {bloco.botoes.map((b, i) => (
              <Link
                key={i}
                href={b.href}
                style={
                  b.variante === 'contorno'
                    ? { color: 'var(--escuro)', border: '2px solid var(--escuro)', padding: '13px 24px', font: '900 14px/1 var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase' }
                    : { background: 'var(--escuro)', color: 'var(--amarelo)', padding: '15px 26px', font: '900 14px/1 var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase' }
                }
              >
                {b.texto}
              </Link>
            ))}
          </div>
        </div>

        <div
          className="hero-media"
          style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <Foto midiaId={f1?.midiaId} legenda={f1?.legenda ?? 'foto principal do grupo'} midias={midias} proporcao={null} style={{ gridColumn: 'span 2', minHeight: 0, border: '3px solid var(--escuro)' }} />
          <Foto midiaId={f2?.midiaId} legenda={f2?.legenda ?? 'foto secundária'} midias={midias} proporcao={null} style={{ minHeight: 0, border: '3px solid var(--escuro)' }} />
          <Foto midiaId={f3?.midiaId} legenda={f3?.legenda ?? 'foto secundária'} midias={midias} proporcao={null} style={{ minHeight: 0, border: '3px solid var(--escuro)' }} />
          <span aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: 54, height: 54, background: 'var(--amarelo)', clipPath: 'polygon(100% 0,100% 100%,0 0)' }} />
        </div>
      </div>
    </section>
  )
}
