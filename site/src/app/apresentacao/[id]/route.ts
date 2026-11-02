import { db } from '@/lib/db'
import { podeVerConteudoRestrito } from '@/lib/auth/sessao'

/**
 * Entrega o HTML de uma apresentação. O arquivo é código de quem enviou,
 * então a rota nunca o serve "solto": o cabeçalho CSP `sandbox` faz o
 * navegador tratar o documento como origem isolada (sem acesso a cookies,
 * sessão ou ao admin), mesmo que alguém abra este endereço direto, fora
 * do iframe da página. O iframe ainda repete o isolamento no próprio
 * atributo `sandbox`.
 *
 * Passa pelo nosso domínio, e não por link direto do Blob, pra o tipo e
 * os cabeçalhos serem sempre os nossos — o storage decide sozinho como
 * entregar HTML.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params

  // formato de cuid: além de barrar lixo, garante que o id não carrega
  // coringa (% ou _) pra dentro da busca abaixo
  if (!/^c[a-z0-9]{20,31}$/.test(id)) return new Response('Apresentação não encontrada.', { status: 404 })

  const ap = await db.apresentacao.findUnique({ where: { id }, select: { url: true } })
  if (!ap) return new Response('Apresentação não encontrada.', { status: 404 })

  // Apresentação usada numa página de minicurso (publicada ou em rascunho)
  // é restrita. Deriva do conteúdo das páginas em vez de depender de um
  // campo que alguém precisaria lembrar de marcar. Se o mesmo arquivo
  // também estiver numa página pública, vale o mais seguro: restrita.
  const padrao = `%${id}%`
  const [{ restrita }] = await db.$queryRaw<{ restrita: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "Pagina"
      WHERE "minicursoId" IS NOT NULL
        AND (blocos::text LIKE ${padrao} OR rascunho::text LIKE ${padrao})
    ) AS "restrita"`

  if (restrita && !(await podeVerConteudoRestrito())) {
    return new Response('Conteúdo restrito a alunos matriculados.', {
      status: 403,
      headers: { 'Cache-Control': 'private, no-store', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // em dev o arquivo é um caminho relativo (/uploads/...), no Blob é uma URL completa
  const origem = await fetch(new URL(ap.url, request.url))
  if (!origem.ok || !origem.body) return new Response('Não consegui carregar o arquivo da apresentação.', { status: 502 })

  return new Response(origem.body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': 'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      // restrita: depende de quem pediu, então nenhum cache compartilhado pode guardar.
      // pública: trocar o arquivo cria um id novo, então o conteúdo de um id não muda;
      // o prazo curto limita por quanto tempo uma cópia antiga fica no ar depois
      // que a apresentação passa a ser usada numa página restrita.
      'Cache-Control': restrita ? 'private, no-store' : 'public, max-age=60, s-maxage=300',
    },
  })
}
