import { db } from '@/lib/db'
import { carregarArvore } from '@/lib/content/pagina'
import { Header } from '@/components/Header'
import { Footer, type ConfigSite } from '@/components/Footer'

const PADRAO: ConfigSite = {
  nomeSite: 'PET EEL',
  descricao: 'Programa de Educação Tutorial de Engenharia Elétrica — UFSC',
  endereco: null, telefone: null, email: null,
  instagram: null, linkedin: null, facebook: null, spotify: null,
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [arvore, config] = await Promise.all([
    carregarArvore(),
    db.config.findUnique({ where: { id: 1 } }),
  ])

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Header arvore={arvore} />
      <main>{children}</main>
      <Footer config={config ?? PADRAO} arvore={arvore} />
    </div>
  )
}
