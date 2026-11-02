import { TAMANHO_MAX_DOC } from '@/lib/storage'

/**
 * Confere os dados que o navegador manda ao registrar um certificado já
 * enviado ao Blob. Devolve a mensagem do problema, ou null se está certo.
 * Só vale arquivo do nosso Blob, com o prefixo certificados/ (que só a rota
 * de upload de certificado emite) e cujo endereço bate com o caminho: sem
 * isso dava pra apontar um certificado pro arquivo de outro aluno.
 */
export function validarCertificadoNoBlob(dados: { url: string; chave: string; tamanho: number }): string | null {
  let u: URL
  try {
    u = new URL(dados.url)
  } catch {
    return 'endereço do arquivo inválido'
  }
  if (u.protocol !== 'https:' || !u.hostname.endsWith('.public.blob.vercel-storage.com')) {
    return 'o arquivo precisa estar no armazenamento do site'
  }

  let caminho: string
  try {
    caminho = decodeURIComponent(u.pathname)
  } catch {
    return 'endereço do arquivo inválido'
  }
  if (!/^certificados\/[A-Za-z0-9-]+\.pdf$/.test(dados.chave) || caminho !== '/' + dados.chave) {
    return 'arquivo de certificado inválido'
  }
  if (!(dados.tamanho > 0 && dados.tamanho <= TAMANHO_MAX_DOC)) return 'tamanho de arquivo inválido'
  return null
}

/**
 * Entrega o PDF de um certificado. O endereço do arquivo no storage nunca
 * vai pro navegador: o servidor busca e repassa, depois de quem chama ter
 * conferido de quem é o certificado. Assim o link não circula e nenhuma
 * URL "pública" do Blob fica exposta no HTML ou na rede.
 */
export async function responderCertificado(
  urlNoStorage: string,
  urlDaRequisicao: string,
  nomeDoArquivo: string,
  modo: 'attachment' | 'inline'
): Promise<Response> {
  // em dev o arquivo é um caminho relativo (/uploads/...), no Blob é uma URL completa
  const origem = await fetch(new URL(urlNoStorage, urlDaRequisicao))
  if (!origem.ok || !origem.body) {
    return new Response('Não consegui carregar o certificado.', { status: 502, headers: { 'Cache-Control': 'private, no-store' } })
  }

  return new Response(origem.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${modo}; filename="${nomeDoArquivo}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      // aberto no navegador (conferência da equipe), o PDF não roda nada fora de sandbox
      'Content-Security-Policy': 'sandbox',
    },
  })
}
