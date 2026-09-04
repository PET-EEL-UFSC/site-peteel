import Link from 'next/link'
import type { NoArvore } from '@/components/blocos/Mapa'

const cond = 'var(--condensada)'

export type ConfigSite = {
  nomeSite: string
  descricao: string
  endereco: string | null
  telefone: string | null
  email: string | null
  instagram: string | null
  linkedin: string | null
  facebook: string | null
  spotify: string | null
}

export function Footer({ config, arvore }: { config: ConfigSite; arvore: NoArvore[] }) {
  const redes = [
    ['Instagram', config.instagram],
    ['LinkedIn', config.linkedin],
    ['Facebook', config.facebook],
  ].filter(([, v]) => !!v) as [string, string][]

  return (
    <footer style={{ background: 'var(--escuro)', color: 'var(--offwhite)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 28px 34px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marca/logo-v2.png" alt="PET EEL" style={{ height: 24, width: 'auto', display: 'block' }} />
          </div>
          <p style={{ marginTop: 16, maxWidth: '32ch', font: '400 14.5px/1.6 var(--corpo)', color: 'rgba(249,249,249,0.8)' }}>{config.descricao}</p>

          {(config.endereco || config.telefone || config.email) && (
            <>
              <p style={{ marginTop: 22, font: `900 11.5px/1 ${cond}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--amarelo)' }}>Contato</p>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, font: '400 14.5px/1.5 var(--corpo)', color: 'rgba(249,249,249,0.8)' }}>
                {config.endereco && <span>{config.endereco}</span>}
                {config.telefone && <span>{config.telefone}</span>}
                {config.email && <a href={`mailto:${config.email}`} style={{ color: 'rgba(249,249,249,0.8)' }}>{config.email}</a>}
              </div>
            </>
          )}
        </div>

        <div>
          <p style={{ font: `900 11.5px/1 ${cond}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--amarelo)' }}>Navegação</p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {arvore.map((n) => (
              <Link key={n.slug} href={n.slug} style={{ font: '400 15px var(--corpo)', color: 'rgba(249,249,249,0.82)' }}>
                {n.titulo}
              </Link>
            ))}
            <Link href="/mapa" style={{ font: '400 15px var(--corpo)', color: 'rgba(249,249,249,0.82)' }}>Mapa do site</Link>
          </div>
        </div>

        {redes.length > 0 && (
          <div>
            <p style={{ font: `900 11.5px/1 ${cond}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--amarelo)' }}>Redes</p>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {redes.map(([nome, url]) => (
                <a key={nome} href={url} target="_blank" rel="noreferrer noopener" style={{ font: '400 15px var(--corpo)', color: 'rgba(249,249,249,0.82)' }}>
                  {nome}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '18px 28px 34px' }}>
        <div style={{ borderTop: '1px solid rgba(249,249,249,0.18)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', font: '400 13px var(--corpo)', color: 'rgba(249,249,249,0.45)' }}>
          <span>Todos os direitos reservados {config.nomeSite}</span>
          <span>Universidade Federal de Santa Catarina</span>
        </div>
      </div>
    </footer>
  )
}
