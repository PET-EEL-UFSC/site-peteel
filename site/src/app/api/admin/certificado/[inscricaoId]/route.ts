import { db } from '@/lib/db'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { entregarCertificado, SELECIONAR_PARA_CERTIFICADO } from '@/lib/certificado'

const NEGADO = { 'Cache-Control': 'private, no-store' }

/** Equipe do painel abre o certificado (enviado ou gerado) pra conferir que está certo. */
export async function GET(request: Request, { params }: { params: Promise<{ inscricaoId: string }> }): Promise<Response> {
  const { inscricaoId } = await params

  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch {
    return new Response('Sem permissão.', { status: 403, headers: NEGADO })
  }

  const insc = await db.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { ...SELECIONAR_PARA_CERTIFICADO, aluno: { select: { nome: true } } },
  })
  if (!insc || !insc.certificadoEm) return new Response('Certificado não encontrado.', { status: 404, headers: NEGADO })

  return entregarCertificado(insc, insc.aluno.nome, request.url, 'inline')
}
