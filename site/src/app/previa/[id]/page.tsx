import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth/sessao'
import { lerBlocos, carregarArvore } from '@/lib/content/pagina'
import { PreviaViva } from './PreviaViva'
import type { ConfigSite } from '@/components/Footer'

const CONFIG_PADRAO: ConfigSite = {
  nomeSite: 'PET EEL',
  descricao: 'Programa de Educação Tutorial de Engenharia Elétrica — UFSC',
  endereco: null, telefone: null, email: null,
  instagram: null, linkedin: null, facebook: null, spotify: null,
}

/**
 * Página servida dentro do iframe do editor. Fica fora de /admin de
 * propósito: assim herda só o CSS do site, sem a barra lateral do painel,
 * e o que aparece é exatamente o que o visitante veria.
 */
export default async function Previa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await exigirUsuario()

  const pagina = await db.pagina.findUnique({ where: { id } })
  if (!pagina) notFound()

  const blocos = lerBlocos(pagina.rascunho ?? pagina.blocos, `prévia de ${pagina.slug}`)

  // Carrega todo o catálogo de mídia e pessoas, não só o que os blocos
  // usam agora: quem está editando pode trocar a foto de um bloco e a
  // prévia precisa resolver a nova sem ida ao servidor.
  const [arvore, config, midias, petianos] = await Promise.all([
    carregarArvore(),
    db.config.findUnique({ where: { id: 1 } }),
    db.midia.findMany({ select: { id: true, url: true, alt: true, largura: true, altura: true }, take: 300 }),
    db.petiano.findMany({
      where: { saiuEm: null },
      select: { id: true, nome: true, cargo: true, tutor: true, bio: true, fotoId: true },
      orderBy: [{ tutor: 'desc' }, { ordem: 'asc' }],
    }),
  ])

  return (
    <PreviaViva
      inicial={blocos}
      arvore={arvore}
      config={config ?? CONFIG_PADRAO}
      dados={{ arvore, petianos, midias: Object.fromEntries(midias.map((m) => [m.id, m])) }}
    />
  )
}
