import { db } from '@/lib/db'

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

  const ap = await db.apresentacao.findUnique({ where: { id }, select: { url: true } })
  if (!ap) return new Response('Apresentação não encontrada.', { status: 404 })

  // em dev o arquivo é um caminho relativo (/uploads/...), no Blob é uma URL completa
  const origem = await fetch(new URL(ap.url, request.url))
  if (!origem.ok || !origem.body) return new Response('Não consegui carregar o arquivo da apresentação.', { status: 502 })

  return new Response(origem.body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': 'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      // trocar o arquivo cria uma linha nova (id novo), então o conteúdo de um id não muda
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  })
}
