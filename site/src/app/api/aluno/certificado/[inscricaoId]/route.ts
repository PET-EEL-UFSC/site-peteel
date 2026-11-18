import { db } from '@/lib/db'
import { alunoDaSessao } from '@/lib/auth/sessao'
import { entregarCertificado, SELECIONAR_PARA_CERTIFICADO } from '@/lib/certificado'

const NEGADO = { 'Cache-Control': 'private, no-store' }

/**
 * O filtro por `alunoId` na busca é o que impede um aluno de baixar o
 * certificado de outro trocando o id na URL: o registro só é encontrado se
 * for dele. Qualquer falha responde igual (404), pra não revelar quais ids
 * existem.
 */
export async function GET(request: Request, { params }: { params: Promise<{ inscricaoId: string }> }): Promise<Response> {
  const { inscricaoId } = await params

  const aluno = await alunoDaSessao()
  if (!aluno) return new Response('Faça login para baixar o certificado.', { status: 401, headers: NEGADO })

  const insc = await db.inscricao.findFirst({
    where: { id: inscricaoId, alunoId: aluno.id, certificadoEm: { not: null }, minicurso: { ativo: true } },
    select: SELECIONAR_PARA_CERTIFICADO,
  })
  if (!insc) return new Response('Certificado não encontrado.', { status: 404, headers: NEGADO })

  // o nome vem da conta do aluno logado, nunca de parâmetro da requisição
  return entregarCertificado(insc, aluno.nome, request.url, 'attachment')
}
