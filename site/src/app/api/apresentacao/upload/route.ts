import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { TAMANHO_MAX_HTML } from '@/lib/storage'

/**
 * Só autoriza o envio direto pro Blob. Quem cria a linha no banco é a
 * Server Action `registrarApresentacao`, chamada pelo navegador depois do
 * upload: é ela que devolve o id pro formulário do elemento, coisa que o
 * callback de conclusão do Blob (rodado pelo servidor deles) não consegue.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await exigirPermissaoAction('subirMidia')
        return {
          allowedContentTypes: ['text/html'],
          maximumSizeInBytes: TAMANHO_MAX_HTML,
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
