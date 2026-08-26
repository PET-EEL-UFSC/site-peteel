import { redirect } from 'next/navigation'
import { auth, signIn } from '@/auth'
import { MENSAGENS } from '@/lib/auth/acesso'

export const metadata = { title: 'Entrar' }

type Props = { searchParams: Promise<{ erro?: string; de?: string }> }

export default async function Entrar({ searchParams }: Props) {
  const { erro, de } = await searchParams
  const sessao = await auth()
  if (sessao?.user && !erro) redirect(de ?? '/admin')

  const mensagem =
    erro === 'nao-convidado' || erro === 'desativado'
      ? MENSAGENS[erro]
      : erro
        ? 'Não foi possível entrar. Tente de novo.'
        : null

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            style={{
              width: 14,
              height: 24,
              background: 'var(--amarelo)',
              border: '1px solid var(--escuro)',
              clipPath: 'polygon(58% 0,0 58%,42% 58%,30% 100%,100% 38%,52% 38%)',
            }}
          />
          <span style={{ font: "900 22px/1 var(--condensada)", letterSpacing: '-0.02em' }}>
            PET<span style={{ color: 'var(--amarelo)', WebkitTextStroke: '0.5px var(--escuro)' }}>eel</span>
          </span>
        </div>

        <h1 style={{ marginTop: 22, fontSize: 34, lineHeight: 1, textTransform: 'uppercase' }}>Painel do site</h1>
        <p style={{ marginTop: 12, font: '400 15px/1.6 var(--corpo)' }}>
          Entre com a conta Google que o grupo cadastrou para você.
        </p>

        {mensagem && (
          <p
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
            {mensagem}
          </p>
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
