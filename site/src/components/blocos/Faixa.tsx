import { hexDe, fundoEscuro } from '@/lib/content/cores'
import { LAYOUTS, TAMANHOS_RAIO, recuoDoRaio, type Faixa as FaixaT } from '@/lib/content/blocos'
import type { MapaMidia } from '@/lib/content/midia'
import { RenderElemento, type Ctx } from './Elementos'

const RAIO = 'polygon(58% 0,0 58%,42% 58%,30% 100%,100% 38%,52% 38%)'

const COLUNAS: Record<keyof typeof LAYOUTS, string> = {
  '1': '1fr',
  '2': '1.05fr 0.95fr',
  '2-60/40': '1.4fr 1fr',
  '3': 'repeat(3,minmax(0,1fr))',
  '2x2': 'repeat(2,minmax(0,1fr))',
}

const ESPACO = { compacto: '48px 28px', normal: '80px 28px', amplo: '112px 28px' }

export function Faixa({ bloco, midias }: { bloco: FaixaT; midias: MapaMidia }) {
  const fundo = hexDe(bloco.fundo)
  const escuro = fundoEscuro(bloco.fundo)
  const ctx: Ctx = { escuro, acento: bloco.acento ?? (escuro ? 'amarelo' : 'azul'), midias }

  const recuo = recuoDoRaio(bloco.decor)

  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: fundo }}>
      {bloco.decor && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            [bloco.decor.lado === 'direita' ? 'right' : 'left']: bloco.decor.sangra ? '-3%' : 0,
            width: TAMANHOS_RAIO[bloco.decor.tamanho],
            height: '100%',
            background: hexDe(bloco.decor.cor),
            clipPath: RAIO,
            opacity: bloco.decor.opacidade,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        className="faixa-grid"
        style={{
          position: 'relative',
          maxWidth: 1280,
          margin: '0 auto',
          padding: ESPACO[bloco.espacamento],
          // o conteúdo desvia do raio: sem isso o texto colide com a
          // decoração em tela estreita
          ...(recuo ? { [recuo.lado === 'left' ? 'paddingLeft' : 'paddingRight']: `max(28px, ${recuo.px}px)` } : {}),
          display: 'grid',
          gridTemplateColumns: COLUNAS[bloco.layout],
          gap: 52,
          alignItems: bloco.alinhamento,
        }}
      >
        {bloco.quadrantes.map((quad, i) => (
          <div key={i} style={{ minWidth: 0 }}>
            {quad.map((el, j) => (
              <RenderElemento key={j} el={el} ctx={ctx} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
