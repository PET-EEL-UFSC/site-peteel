import Link from 'next/link'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Inscrições em minicursos' }

export default async function Inscricoes() {
  // só título e carga horária dos minicursos com inscrição aberta
  const abertos = await db.minicurso.findMany({
    where: { ativo: true, inscricoesAbertas: true },
    orderBy: { criadoEm: 'desc' },
    select: { slug: true, titulo: true, cargaHoraria: true },
  })

  return (
    <section style={{ maxWidth: 800, margin: '0 auto', padding: '54px 28px 88px' }}>
      <h1 style={{ fontSize: 'clamp(30px,4vw,44px)', lineHeight: 1, textTransform: 'uppercase' }}>Inscrições em minicursos</h1>
      {abertos.length === 0 ? (
        <p style={{ marginTop: 20, font: '400 16px/1.6 var(--corpo)' }}>Não há minicursos com inscrição aberta no momento.</p>
      ) : (
        <ul style={{ marginTop: 28, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {abertos.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/inscricao/${m.slug}`}
                style={{ display: 'block', background: '#fff', border: '3px solid var(--escuro)', padding: '20px 22px' }}
              >
                <span style={{ font: '900 22px/1.1 var(--condensada)', textTransform: 'uppercase' }}>{m.titulo}</span>
                {m.cargaHoraria && (
                  <span style={{ display: 'block', marginTop: 6, font: '700 12px var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(44,43,34,0.6)' }}>
                    {m.cargaHoraria} horas
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
