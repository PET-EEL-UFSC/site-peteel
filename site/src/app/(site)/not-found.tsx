import Link from 'next/link'

export default function NaoEncontrada() {
  return (
    <section style={{ background: 'var(--amarelo)', minHeight: '70svh', display: 'grid', placeItems: 'center', padding: '120px 28px 80px' }}>
      <div style={{ maxWidth: 1280, width: '100%' }}>
        <p style={{ font: '700 12px/1 var(--condensada)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Erro 404</p>
        <h1 style={{ marginTop: 18, fontSize: 'clamp(40px,7vw,96px)', lineHeight: 0.92, textTransform: 'uppercase', maxWidth: '14ch' }}>
          Essa página não existe
        </h1>
        <Link
          href="/"
          style={{ display: 'inline-block', marginTop: 30, background: 'var(--escuro)', color: 'var(--amarelo)', padding: '15px 26px', font: '900 14px/1 var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          Voltar ao início
        </Link>
      </div>
    </section>
  )
}
