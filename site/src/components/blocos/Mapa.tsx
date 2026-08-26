import Link from 'next/link'

export type NoArvore = { slug: string; titulo: string; filhos: NoArvore[] }

/** Gerado da árvore de páginas — não tem conteúdo próprio para editar. */
export function Mapa({ arvore }: { arvore: NoArvore[] }) {
  return (
    <section className="secao" style={{ maxWidth: 1280, margin: '0 auto', padding: '54px 28px 88px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 22 }}>
        {arvore.map((raiz) => (
          <div key={raiz.slug}>
            <h3 style={{ display: 'inline-block', background: 'var(--escuro)', color: 'var(--offwhite)', padding: '8px 16px 10px', font: '900 20px/1 var(--condensada)', textTransform: 'uppercase' }}>
              {raiz.titulo}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
              {[raiz, ...raiz.filhos].map((n) => (
                <Link
                  key={n.slug}
                  href={n.slug}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '11px 0', borderTop: '1px solid rgba(44,43,34,0.2)', color: 'var(--escuro)', font: '400 15px var(--corpo)' }}
                >
                  <span>{n.titulo}</span>
                  <span style={{ font: '400 12px var(--condensada)', color: 'rgba(44,43,34,0.5)' }}>{n.slug}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
