import Link from 'next/link'
import { signOut } from '@/auth'
import { alunoDaSessao } from '@/lib/auth/sessao'

export const metadata = {
  title: 'Área do aluno',
  robots: { index: false, follow: false },
}

/**
 * O layout só mostra o nome. Quem protege o conteúdo é cada página (um
 * layout não reexecuta a cada navegação interna, então não serve de portão).
 */
export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const aluno = await alunoDaSessao()

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <header style={{ background: 'var(--escuro)', color: '#F9F9F9' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/aluno" style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marca/logo-v2.png" alt="PET EEL" style={{ height: 24, width: 'auto', display: 'block' }} />
            <span style={{ font: '900 13px/1 var(--condensada)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--amarelo)' }}>
              Área do aluno
            </span>
          </Link>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <Link href="/aluno" style={{ font: '700 12px var(--condensada)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amarelo)' }}>
              Minhas aulas
            </Link>
            <Link href="/" style={{ font: '400 13px var(--corpo)', color: 'rgba(249,249,249,0.75)' }}>
              Site do PET EEL
            </Link>
            {aluno && (
              <>
                <span style={{ font: '400 13px var(--corpo)', color: 'rgba(249,249,249,0.75)' }}>{aluno.nome}</span>
                <form
                  action={async () => {
                    'use server'
                    await signOut({ redirectTo: '/entrar?de=/aluno' })
                  }}
                >
                  <button
                    type="submit"
                    style={{ background: 'none', border: '1px solid rgba(249,249,249,0.4)', color: '#F9F9F9', padding: '6px 12px', font: '700 11px var(--condensada)', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Sair
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
