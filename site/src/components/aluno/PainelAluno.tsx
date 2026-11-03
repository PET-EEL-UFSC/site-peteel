import Link from 'next/link'
import { TextoComLinks } from './TextoComLinks'

export type MinicursoDoAluno = {
  inscricaoId: string
  titulo: string
  descricao: string | null
  cargaHoraria: number | null
  certificadoLiberado: boolean
  aulas: { slug: string; titulo: string }[]
}

const cond = 'var(--condensada)'

export function PainelAluno({ nome, minicursos }: { nome: string; minicursos: MinicursoDoAluno[] }) {
  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: '54px 28px 88px' }}>
      <h1 style={{ fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1, textTransform: 'uppercase' }}>Olá, {nome.split(' ')[0]}</h1>
      <p style={{ marginTop: 14, maxWidth: '60ch', font: '400 16px/1.6 var(--corpo)' }}>
        Aqui ficam as aulas e os certificados dos minicursos em que você está inscrito.
      </p>

      {minicursos.length === 0 && (
        <p style={{ marginTop: 32, font: '400 15px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.7)' }}>
          Você ainda não tem nenhum minicurso ativo. Se acabou de se inscrever, fale com a organização.
        </p>
      )}

      <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {minicursos.map((m) => (
          <article key={m.inscricaoId} style={{ background: '#fff', border: '3px solid var(--escuro)', padding: '24px 26px 26px' }}>
            <h2 style={{ fontSize: 26, lineHeight: 1.05, textTransform: 'uppercase' }}>{m.titulo}</h2>
            {m.cargaHoraria && (
              <p style={{ marginTop: 6, font: `700 11px/1 ${cond}`, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(44,43,34,0.6)' }}>
                {m.cargaHoraria} horas
              </p>
            )}

            {m.descricao && (
              <p style={{ marginTop: 14, maxWidth: '70ch', whiteSpace: 'pre-line', font: '400 15.5px/1.6 var(--corpo)' }}>
                <TextoComLinks texto={m.descricao} />
              </p>
            )}

            <h3 style={{ marginTop: 22, font: `900 12px/1 ${cond}`, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Aulas</h3>
            {m.aulas.length === 0 ? (
              <p style={{ marginTop: 8, font: '400 14.5px/1.55 var(--corpo)', color: 'rgba(44,43,34,0.65)' }}>As aulas serão publicadas aqui.</p>
            ) : (
              <ul style={{ marginTop: 8, listStyle: 'none', padding: 0 }}>
                {m.aulas.map((a) => (
                  <li key={a.slug} style={{ borderTop: '1px solid rgba(44,43,34,0.2)' }}>
                    <Link
                      href={`/aluno${a.slug}`}
                      style={{ display: 'block', padding: '12px 0', font: `900 16px/1.2 ${cond}`, textTransform: 'uppercase', color: 'var(--escuro)' }}
                    >
                      {a.titulo} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <h3 style={{ marginTop: 22, font: `900 12px/1 ${cond}`, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Certificado</h3>
            {m.certificadoLiberado ? (
              <a
                href={`/api/aluno/certificado/${m.inscricaoId}`}
                style={{ display: 'inline-block', marginTop: 10, background: 'var(--escuro)', color: 'var(--amarelo)', padding: '13px 22px', font: `900 12px/1 ${cond}`, letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                Baixar certificado (PDF)
              </a>
            ) : (
              <p style={{ marginTop: 8, font: '400 14.5px/1.55 var(--corpo)', color: 'rgba(44,43,34,0.65)' }}>
                Disponível aqui quando a organização enviar, ao fim do minicurso.
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
