import { db } from '@/lib/db'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { responderCertificado } from '@/lib/certificado'

const NEGADO = { 'Cache-Control': 'private, no-store' }

/** Equipe do painel abre o PDF enviado pra conferir que é o do aluno certo. */
export async function GET(request: Request, { params }: { params: Promise<{ inscricaoId: string }> }): Promise<Response> {
  const { inscricaoId } = await params

  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch {
    return new Response('Sem permissão.', { status: 403, headers: NEGADO })
  }

  const insc = await db.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { certificadoUrl: true, minicurso: { select: { slug: true } } },
  })
  if (!insc?.certificadoUrl) return new Response('Certificado não encontrado.', { status: 404, headers: NEGADO })

  return responderCertificado(insc.certificadoUrl, request.url, `certificado-${insc.minicurso.slug}.pdf`, 'inline')
}
