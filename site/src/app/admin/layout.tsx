import { cookies } from 'next/headers'
import { BarraLateral } from './_componentes/BarraLateral'
import type { NomeIcone } from './_componentes/icones'
import { exigirUsuario } from '@/lib/auth/sessao'
import { pode } from '@/lib/auth/acesso'
import { signOut } from '@/auth'
import './admin.css'

export const metadata = { title: 'Painel' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario()
  const recolhidoInicial = (await cookies()).get('painel-recolhido')?.value === '1'

  const itens: [string, string, NomeIcone][] = [
    ['/admin', 'Páginas', 'paginas'],
    ['/admin/midia', 'Imagens', 'imagens'],
    ['/admin/pessoas', 'Pessoas', 'pessoas'],
  ]
  if (pode(u.papel, 'gerenciarMinicursos')) itens.push(['/admin/minicursos', 'Minicursos', 'minicursos'])
  if (pode(u.papel, 'gerenciarAcessos')) itens.push(['/admin/acessos', 'Acessos', 'acessos'])
  if (pode(u.papel, 'configurarSite')) itens.push(['/admin/config', 'Configuração', 'configuracao'])

  return (
    <BarraLateral
      recolhidoInicial={recolhidoInicial}
      itens={itens}
      nomeUsuario={u.nome ?? u.email}
      papelRotulo={u.papel === 'ADMIN' ? 'Administrador' : 'Editor'}
      sair={async () => {
        'use server'
        await signOut({ redirectTo: '/entrar' })
      }}
    >
      {children}
    </BarraLateral>
  )
}
