import { hexDe, fundoEscuro } from '@/lib/content/cores'
import { TAMANHOS_RAIO, type Bloco } from '@/lib/content/blocos'

type CabecalhoT = Extract<Bloco, { tipo: 'cabecalho' }>
const RAIO = 'polygon(58% 0,0 58%,42% 58%,30% 100%,100% 38%,52% 38%)'

export function Cabecalho({ bloco }: { bloco: CabecalhoT }) {
  const fundo = hexDe(bloco.fundo)
  const escuro = fundoEscuro(bloco.fundo)
  const texto = escuro ? '#F9F9F9' : '#2C2B22'

  return (
    <div className="cabecalho" style={{ position: 'relative', background: fundo, overflow: 'hidden', padding: '128px 28px 54px' }}>
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
          }}
        />
      )}
      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto' }}>
        <p style={{ font: '700 11.5px/1 var(--condensada)', letterSpacing: '0.16em', textTransform: 'uppercase', color: texto }}>
          {bloco.migalha}
        </p>
        <h1 style={{ marginTop: 16, fontSize: 'clamp(40px,6vw,74px)', lineHeight: 0.92, textTransform: 'uppercase', maxWidth: '18ch', color: texto }}>
          {bloco.titulo}
        </h1>
        {bloco.texto && (
          <p style={{ marginTop: 18, maxWidth: '56ch', font: '400 17px/1.55 var(--corpo)', color: escuro ? 'rgba(249,249,249,0.78)' : '#2C2B22' }}>
            {bloco.texto}
          </p>
        )}
      </div>
    </div>
  )
}
