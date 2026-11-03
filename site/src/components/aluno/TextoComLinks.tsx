import { partirEmLinks } from '@/lib/links'

/** Texto com quebras de linha preservadas e endereços http(s) clicáveis (ver partirEmLinks). */
export function TextoComLinks({ texto }: { texto: string }) {
  return (
    <>
      {partirEmLinks(texto).map((t, i) =>
        t.href ? (
          <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', overflowWrap: 'anywhere' }}>
            {t.texto}
          </a>
        ) : (
          <span key={i}>{t.texto}</span>
        )
      )}
    </>
  )
}
