import { redirect } from 'next/navigation'
import { auth, signIn } from '@/auth'
import { mensagemDeErro } from '@/lib/auth/acesso'

export const metadata = { title: 'Entrar' }

type Props = { searchParams: Promise<{ erro?: string; error?: string; de?: string }> }

export default async function Entrar({ searchParams }: Props) {
  const params = await searchParams
  const { de } = params
  // o Auth.js devolve ?error=, os nossos redirecionamentos usam ?erro=
  const erro = params.erro ?? params.error
  const sessao = await auth()
  if (sessao?.user && !erro) redirect(de ?? '/admin')

  const problema = mensagemDeErro(erro)

  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--amarelo)',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: '3px solid var(--escuro)', padding: '40px 34px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--escuro)', padding: '10px 16px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca/logo-v2.png" alt="PET EEL" style={{ height: 26, width: 'auto', display: 'block' }} />
        </div>

        <h1 style={{ marginTop: 22, fontSize: 34, lineHeight: 1, textTransform: 'uppercase' }}>Painel do site</h1>
        <p style={{ marginTop: 12, font: '400 15px/1.6 var(--corpo)' }}>
          Entre com a conta Google que o grupo cadastrou para você.
        </p>

        {problema && (
          <div
            role="alert"
            style={{
              marginTop: 18,
              padding: '12px 14px',
              background: '#2C2B22',
              color: '#F9F9F9',
              font: '400 14px/1.5 var(--corpo)',
              borderLeft: '4px solid var(--laranja)',
            }}
          >
            <p>{problema.texto}</p>
            {problema.tecnico && (
              // detalhe para quem está montando o site; quem só quer
              // entrar não precisa ver isso aberto
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', font: '700 11px var(--condensada)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--amarelo)' }}>
                  Detalhes técnicos
                </summary>
                <p style={{ marginTop: 6, font: '400 12.5px/1.5 var(--corpo)', color: 'rgba(249,249,249,0.75)' }}>
                  {problema.tecnico}
                </p>
              </details>
            )}
          </div>
        )}

        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: de ?? '/admin' })
          }}
        >
          <button
            type="submit"
            style={{
              marginTop: 24,
              width: '100%',
              background: 'var(--escuro)',
              color: 'var(--amarelo)',
              border: 'none',
              padding: '16px 24px',
              font: "900 14px/1 var(--condensada)",
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Entrar com Google
          </button>
        </form>

        <p style={{ marginTop: 20, font: '400 13px/1.5 var(--corpo)', color: 'rgba(44,43,34,0.6)' }}>
          Não tem acesso? Um administrador do grupo precisa te adicionar antes do primeiro login.
        </p>
      </div>
    </main>
  )
}
