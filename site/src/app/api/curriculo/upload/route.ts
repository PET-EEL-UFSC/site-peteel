import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { TAMANHO_MAX_DOC } from '@/lib/storage'

type PayloadCliente = { petianoId: string; nome: string; tamanho: number }

/** Mesma razão de existir da rota de mídia: contornar o teto de 4,5 MB de Server Action da Vercel. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const usuario = await exigirPermissaoAction('gerenciarPetianos')
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: TAMANHO_MAX_DOC,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ usuarioId: usuario.id, ...(clientPayload ? JSON.parse(clientPayload) : {}) }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return
        const dados = JSON.parse(tokenPayload) as PayloadCliente & { usuarioId: string }
        const doc = await db.documento.create({
          data: { chave: blob.pathname, url: blob.url, nome: dados.nome, tamanho: dados.tamanho, enviadoPorId: dados.usuarioId },
        })
        await db.petiano.update({ where: { id: dados.petianoId }, data: { curriculoId: doc.id } })
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
