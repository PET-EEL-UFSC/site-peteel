import { TAMANHO_MAX_DOC } from '@/lib/storage'
import { caixasSchema } from '@/lib/certificado-modelo'
import { gerarCertificadoPdf, type ModeloParaPdf } from '@/lib/certificado-pdf'

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

const CABECALHOS_PDF = {
  'Content-Type': 'application/pdf',
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  // aberto no navegador (conferência da equipe), o PDF não roda nada fora de sandbox
  'Content-Security-Policy': 'sandbox',
} as const

/** O que a busca no banco precisa trazer pra entregar o certificado de uma inscrição. */
export const SELECIONAR_PARA_CERTIFICADO = {
  certificadoUrl: true,
  certificadoEm: true,
  minicurso: {
    select: {
      slug: true,
      titulo: true,
      cargaHoraria: true,
      modeloCertificado: { select: { caixas: true, fundoMidia: { select: { url: true } } } },
    },
  },
} as const

export type ModeloDoBanco = { caixas: unknown; fundoMidia: { url: string } | null }

const MAX_FUNDO_BYTES = 12 * 1024 * 1024

async function baixar(url: string, base: string, limite: number): Promise<Uint8Array | undefined> {
  try {
    const r = await fetch(new URL(url, base))
    if (!r.ok) return undefined
    const bytes = new Uint8Array(await r.arrayBuffer())
    return bytes.length <= limite ? bytes : undefined
  } catch {
    return undefined
  }
}

/**
 * Gera o PDF. Modelo do banco (fundo + caixas) quando válido; qualquer
 * problema com ele (caixas fora do formato, fundo que não baixa) cai no
 * desenho padrão em vez de deixar o aluno sem certificado.
 */
export async function gerarPdfDeCertificado(
  dados: { nome: string; minicurso: string; cargaHoraria: number | null; emitidoEm: Date },
  modelo: ModeloDoBanco | null,
  urlDaRequisicao: string
): Promise<Uint8Array> {
  const caixas = modelo ? caixasSchema.safeParse(modelo.caixas) : null
  if (modelo && caixas?.success) {
    const fundo = modelo.fundoMidia ? await baixar(modelo.fundoMidia.url, urlDaRequisicao, MAX_FUNDO_BYTES) : undefined
    const m: ModeloParaPdf = { fundo, caixas: caixas.data }
    return gerarCertificadoPdf(dados, { modelo: m })
  }

  // a logo é um arquivo estático do próprio site; se não vier, o certificado sai só com o texto
  const origem = process.env.NEXTAUTH_URL ?? new URL(urlDaRequisicao).origin
  const logoPng = await baixar('/marca/logo-v2.png', origem, 2 * 1024 * 1024)
  return gerarCertificadoPdf(dados, { logoPng })
}

/**
 * Entrega o certificado de uma inscrição: o PDF enviado à mão, se existir;
 * senão o gerado pelo modelo do minicurso. Quem chama já conferiu de quem é.
 */
export async function entregarCertificado(
  insc: { certificadoUrl: string | null; certificadoEm: Date | null; minicurso: { slug: string; titulo: string; cargaHoraria: number | null; modeloCertificado: ModeloDoBanco | null } },
  nomeDoAluno: string,
  urlDaRequisicao: string,
  modo: 'attachment' | 'inline'
): Promise<Response> {
  const nomeDoArquivo = `certificado-${insc.minicurso.slug}.pdf`
  if (insc.certificadoUrl) return responderCertificado(insc.certificadoUrl, urlDaRequisicao, nomeDoArquivo, modo)

  const pdf = await gerarPdfDeCertificado(
    { nome: nomeDoAluno, minicurso: insc.minicurso.titulo, cargaHoraria: insc.minicurso.cargaHoraria, emitidoEm: insc.certificadoEm ?? new Date() },
    insc.minicurso.modeloCertificado,
    urlDaRequisicao
  )
  return new Response(Buffer.from(pdf), {
    headers: { ...CABECALHOS_PDF, 'Content-Disposition': `${modo}; filename="${nomeDoArquivo}"` },
  })
}
