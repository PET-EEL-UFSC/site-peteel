import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { lerBlocos, carregarDados } from '@/lib/content/pagina'
import { RenderBlocos } from '@/components/blocos'
import { Aviso } from '@/components/Aviso'

type Props = { params: Promise<{ slug?: string[] }> }

function slugDe(partes: string[] | undefined): string {
  return '/' + (partes ?? []).join('/')
}

export async function generateStaticParams() {
  const paginas = await db.pagina.findMany({
    where: { status: 'PUBLICADA' },
    select: { slug: true },
  })
  return paginas.map((p) => ({
    slug: p.slug === '/' ? [] : p.slug.replace(/^\//, '').split('/'),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pagina = await db.pagina.findUnique({
    where: { slug: slugDe(slug) },
    select: { titulo: true, descricao: true, status: true },
  })
  if (!pagina || pagina.status !== 'PUBLICADA') return {}
  return { title: pagina.titulo, description: pagina.descricao ?? undefined }
}

export default async function Pagina({ params }: Props) {
  const { slug } = await params
  const caminho = slugDe(slug)

  const [pagina, config] = await Promise.all([
    db.pagina.findUnique({ where: { slug: caminho } }),
    db.config.findUnique({ where: { id: 1 } }),
  ])

  if (!pagina || pagina.status !== 'PUBLICADA') notFound()

  const blocos = lerBlocos(pagina.blocos, `página ${caminho}`)
  const dados = await carregarDados(blocos)

  // O aviso entra logo após o hero, quando existe
  const temHero = blocos[0]?.tipo === 'hero'
  const mostrarAviso = config?.avisoAtivo && config.avisoTexto && temHero

  if (!mostrarAviso) return <RenderBlocos blocos={blocos} dados={dados} />

  return (
    <>
      <RenderBlocos blocos={blocos.slice(0, 1)} dados={dados} />
      <Aviso texto={config!.avisoTexto!} link={config!.avisoLink} />
      <RenderBlocos blocos={blocos.slice(1)} dados={dados} />
    </>
  )
}
