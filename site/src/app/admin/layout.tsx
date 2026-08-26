import Link from 'next/link'
import { exigirUsuario } from '@/lib/auth/sessao'
import { pode } from '@/lib/auth/acesso'
import { signOut } from '@/auth'
import './admin.css'

export const metadata = { title: 'Painel' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario()

  const itens: [string, string][] = [
    ['/admin', 'Páginas'],
    ['/admin/midia', 'Imagens'],
    ['/admin/pessoas', 'Pessoas'],
  ]
  if (pode(u.papel, 'gerenciarPessoas')) itens.push(['/admin/acessos', 'Acessos'])
  if (pode(u.papel, 'publicar')) itens.push(['/admin/config', 'Configuração'])

  return (
    <div className="painel">
      <nav className="painel-nav">
        <div style={{ padding: '0 22px 18px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span aria-hidden style={{ width: 12, height: 21, background: 'var(--amarelo)', clipPath: 'polygon(58% 0,0 58%,42% 58%,30% 100%,100% 38%,52% 38%)' }} />
          <span style={{ font: '900 19px/1 var(--condensada)', color: 'var(--offwhite)' }}>
            PET<span style={{ color: 'var(--amarelo)' }}>eel</span>
          </span>
        </div>

        {itens.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}

        <div style={{ marginTop: 'auto', padding: '18px 22px 0' }}>
          <p style={{ font: '400 12px/1.4 var(--corpo)', color: 'rgba(249,249,249,0.55)' }}>
            {u.nome ?? u.email}
            <br />
            <span style={{ color: 'var(--amarelo)', font: '700 10.5px var(--condensada)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {u.papel === 'ADMIN' ? 'Administrador' : 'Editor'}
            </span>
          </p>
          <Link href="/" style={{ padding: '10px 0', color: 'rgba(249,249,249,0.6)', font: '400 12.5px var(--corpo)', textTransform: 'none', letterSpacing: 0 }}>
            Ver o site →
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/entrar' })
            }}
          >
            <button type="submit" style={{ background: 'none', border: 'none', padding: '4px 0', color: 'rgba(249,249,249,0.6)', font: '400 12.5px var(--corpo)', cursor: 'pointer' }}>
              Sair
            </button>
          </form>
        </div>
      </nav>

      <div className="painel-corpo">{children}</div>
    </div>
  )
}
