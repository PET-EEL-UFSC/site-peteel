import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { exigirAluno } from '@/lib/auth/sessao'
import { lerBlocos, carregarDados } from '@/lib/content/pagina'
import { RenderBlocos } from '@/components/blocos'
import { PainelAluno } from '@/components/aluno/PainelAluno'

// Depende de quem está logado: nunca gerar estático nem guardar em cache.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug?: string[] }> }

export default async function AreaDoAluno({ params }: Props) {
  const { slug } = await params

  // /aluno: painel com os minicursos da pessoa
  if (!slug || slug.length === 0) {
    const aluno = await exigirAluno('/aluno')

    const inscricoes = await db.inscricao.findMany({
      where: { alunoId: aluno.id, minicurso: { ativo: true } },
      orderBy: { criadoEm: 'asc' },
      select: {
        id: true,
        certificadoEm: true,
        minicurso: {
          select: {
            titulo: true,
            cargaHoraria: true,
            paginas: {
              where: { status: 'PUBLICADA' },
              orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
              select: { slug: true, titulo: true },
            },
          },
        },
      },
    })

    return (
      <PainelAluno
        nome={aluno.nome}
        minicursos={inscricoes.map((i) => ({
          inscricaoId: i.id,
          titulo: i.minicurso.titulo,
          cargaHoraria: i.minicurso.cargaHoraria,
          certificadoLiberado: i.certificadoEm !== null,
          aulas: i.minicurso.paginas,
        }))}
      />
    )
  }

  // /aluno/<endereço da página>: uma aula
  const caminho = '/' + slug.join('/')
  const aluno = await exigirAluno(`/aluno${caminho}`)

  const pagina = await db.pagina.findUnique({ where: { slug: caminho } })
  if (!pagina || pagina.status !== 'PUBLICADA' || !pagina.minicursoId) notFound()

  // A matrícula é conferida a cada acesso, no servidor. 404 (e não 403)
  // pra quem não está inscrito: não confirma que existe aula nesse endereço.
  const inscrito = await db.inscricao.findFirst({
    where: { alunoId: aluno.id, minicursoId: pagina.minicursoId, minicurso: { ativo: true } },
    select: { id: true },
  })
  if (!inscrito) notFound()

  const blocos = lerBlocos(pagina.blocos, `aula ${caminho}`)
  const dados = await carregarDados(blocos)

  return <RenderBlocos blocos={blocos} dados={dados} />
}
