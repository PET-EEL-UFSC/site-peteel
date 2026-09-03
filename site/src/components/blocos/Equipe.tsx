import type { Bloco } from '@/lib/content/blocos'
import type { MapaMidia } from '@/lib/content/midia'
import { Foto } from '@/components/Foto'

type EquipeT = Extract<Bloco, { tipo: 'equipe' }>

export type PetianoResolvido = {
  id: string
  nome: string
  cargo: string
  tutor: boolean
  bio: string | null
  fotoId: string | null
  linkedin: string | null
  curriculo: { url: string } | null
}

/**
 * Sai do banco de pessoas, não de conteúdo digitado — senão toda gestão
 * redigita os 12 membros.
 */
export function Equipe({
  bloco,
  petianos,
  midias,
}: {
  bloco: EquipeT
  petianos: PetianoResolvido[]
  midias: MapaMidia
}) {
  const tutor = petianos.find((p) => p.tutor)
  const membros = petianos.filter((p) => !p.tutor).slice(0, bloco.limite ?? undefined)

  return (
    <section className="secao" style={{ maxWidth: 1280, margin: '0 auto', padding: '54px 28px 88px' }}>
      {bloco.titulo && (
        <h2 style={{ display: 'inline-block', background: 'var(--escuro)', color: 'var(--offwhite)', padding: '10px 22px 12px', fontSize: 34, lineHeight: 1, marginBottom: 32 }}>
          {bloco.titulo}
        </h2>
      )}

      {bloco.mostrarTutor && tutor && (
        <div
          className="tutor-card"
          style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 34, alignItems: 'center', background: '#fff', border: '3px solid var(--escuro)', marginBottom: 46, overflow: 'hidden' }}
        >
          <Foto midiaId={tutor.fotoId} legenda="foto do tutor" midias={midias} proporcao="4/5" />
          <div style={{ padding: '32px 34px 34px 0' }}>
            <span style={{ display: 'inline-block', background: 'var(--amarelo)', color: 'var(--escuro)', padding: '6px 12px', font: '900 11px/1 var(--condensada)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {tutor.cargo}
            </span>
            <h2 style={{ marginTop: 16, fontSize: 'clamp(30px,3.4vw,46px)', lineHeight: 1, textTransform: 'uppercase' }}>{tutor.nome}</h2>
            {tutor.bio && <p style={{ marginTop: 14, maxWidth: '52ch', font: '400 16px/1.6 var(--corpo)' }}>{tutor.bio}</p>}
            {(tutor.linkedin || tutor.curriculo) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                {tutor.linkedin && (
                  <a
                    href={tutor.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{ display: 'inline-block', padding: '9px 18px', fontSize: 12 }}
                  >
                    LinkedIn
                  </a>
                )}
                {tutor.curriculo && (
                  <a
                    href={tutor.curriculo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-claro"
                    style={{ display: 'inline-block', padding: '9px 18px', fontSize: 12 }}
                  >
                    Currículo
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
        {membros.map((p) => (
          <figure key={p.id} style={{ position: 'relative', margin: 0, border: '2px solid var(--escuro)', overflow: 'hidden' }}>
            <Foto midiaId={p.fotoId} legenda={p.nome} midias={midias} proporcao="4/5" />
            <figcaption
              style={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                background: 'var(--amarelo)',
                padding: '10px 12px',
              }}
            >
              <div style={{ font: '900 16px/1 var(--condensada)', textTransform: 'uppercase', color: 'var(--escuro)' }}>{p.nome}</div>
              <div style={{ marginTop: 5, font: '700 10.5px/1.2 var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--escuro)' }}>{p.cargo}</div>
              {(p.linkedin || p.curriculo) && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {p.linkedin && (
                    <a
                      href={p.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ font: '700 9.5px/1 var(--condensada)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--escuro)', background: 'rgba(44,43,34,0.12)', padding: '4px 8px' }}
                    >
                      LinkedIn
                    </a>
                  )}
                  {p.curriculo && (
                    <a
                      href={p.curriculo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ font: '700 9.5px/1 var(--condensada)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--escuro)', background: 'rgba(44,43,34,0.12)', padding: '4px 8px' }}
                    >
                      CV
                    </a>
                  )}
                </div>
              )}
            </figcaption>
            <span aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: 44, height: 44, background: 'var(--amarelo)', clipPath: 'polygon(100% 0,100% 100%,0 0)' }} />
          </figure>
        ))}
      </div>

      {membros.length === 0 && (
        <p style={{ font: '400 15px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.6)' }}>
          Nenhum petiano cadastrado ainda. Adicione em Painel → Pessoas.
        </p>
      )}
    </section>
  )
}
