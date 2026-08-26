import type { MapaMidia } from '@/lib/content/midia'

/**
 * Slot de foto. Enquanto não há imagem enviada mostra o placeholder
 * listrado do mockup — o site fica publicável mesmo com foto faltando,
 * e o buraco é visível o bastante para alguém preencher.
 */
export function Foto({
  midiaId,
  legenda,
  midias,
  proporcao = '4/3',
  className,
  style,
  claro = false,
}: {
  midiaId: string | null | undefined
  legenda?: string
  midias: MapaMidia
  /** null desliga a proporção fixa — a caixa passa a obedecer o grid */
  proporcao?: string | null
  className?: string
  style?: React.CSSProperties
  claro?: boolean
}) {
  const m = midiaId ? midias[midiaId] : undefined

  const base: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(proporcao ? { aspectRatio: proporcao } : {}),
    ...style,
  }

  if (m) {
    return (
      <div className={className} style={base}>
        {/* img simples: as fotos vêm do Blob/uploads com dimensões conhecidas
            e o layout já reserva a caixa pela aspect-ratio */}
        <img
          src={m.url}
          alt={m.alt}
          width={m.largura}
          height={m.altura}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        ...base,
        background: claro
          ? 'repeating-linear-gradient(135deg,#e6e5dd 0 9px,#d8d7cc 9px 18px)'
          : 'repeating-linear-gradient(135deg,#3a382d 0 9px,#2C2B22 9px 18px)',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: 10,
        font: '400 11px var(--corpo)',
        color: claro ? 'rgba(44,43,34,0.45)' : 'rgba(249,249,249,0.45)',
      }}
    >
      {legenda ?? 'foto'}
    </div>
  )
}
