import Link from 'next/link'

/** Faixa de aviso logo abaixo do hero — "Sexta, 12h10, seminário". */
export function Aviso({ texto, link }: { texto: string; link: string | null }) {
  return (
    <div style={{ background: 'var(--escuro)', color: 'var(--offwhite)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 28px', display: 'flex', gap: 30, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ font: '400 14px/1.4 var(--corpo)', color: 'rgba(249,249,249,0.85)' }}>{texto}</span>
        {link && (
          <Link href={link} style={{ marginLeft: 'auto', font: '900 12px/1 var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--amarelo)' }}>
            Ver mais →
          </Link>
        )}
      </div>
    </div>
  )
}
