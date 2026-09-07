import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { TIPOS_OK, TAMANHO_MAX } from '@/lib/storage'

type PayloadCliente = { alt: string; largura: number; altura: number; tamanho: number }

/**
 * Emite o token de upload e recebe o aviso de conclusão do Vercel Blob.
 *
 * Existe porque uma Server Action tem um teto de 4,5 MB de corpo de
 * requisição imposto pela própria Vercel (não é o `bodySizeLimit` do
 * Next, esse já era maior) — acima disso a requisição nem chega no
 * nosso código, o navegador só vê a conexão morrer. Aqui o arquivo vai
 * direto do navegador pro Blob; esta rota só autoriza e registra.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const usuario = await exigirPermissaoAction('subirMidia')
        return {
          allowedContentTypes: [...TIPOS_OK],
          maximumSizeInBytes: TAMANHO_MAX,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ usuarioId: usuario.id, ...(clientPayload ? JSON.parse(clientPayload) : {}) }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return
        const dados = JSON.parse(tokenPayload) as PayloadCliente & { usuarioId: string }
        await db.midia.create({
          data: {
            chave: blob.pathname,
            url: blob.url,
            alt: dados.alt,
            largura: dados.largura,
            altura: dados.altura,
            tamanho: dados.tamanho,
            mimeType: blob.contentType,
            enviadoPorId: dados.usuarioId,
          },
        })
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
