import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { TAMANHO_MAX_DOC } from '@/lib/storage'

/**
 * Só autoriza o envio direto pro Blob (o PDF é grande demais pra passar por
 * Server Action na Vercel). Quem vincula o arquivo à inscrição é
 * `registrarCertificado`, que só aceita o que passou por aqui: caminho com
 * prefixo certificados/, que esta rota exige.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await exigirPermissaoAction('gerenciarMinicursos')
        if (!/^certificados\/[A-Za-z0-9-]+\.pdf$/.test(pathname)) throw new Error('caminho de certificado inválido')
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: TAMANHO_MAX_DOC,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
