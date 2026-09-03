import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export type Salvo = { chave: string; url: string }

const TIPOS_OK = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const
const TAMANHO_MAX = 8 * 1024 * 1024 // 8 MB

export function validarImagem(arquivo: File): string | null {
  if (!TIPOS_OK.includes(arquivo.type as (typeof TIPOS_OK)[number])) {
    return 'Formato não aceito. Use JPG, PNG, WebP ou AVIF.'
  }
  if (arquivo.size > TAMANHO_MAX) {
    return `A imagem tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. O limite é 8 MB.`
  }
  return null
}

const TAMANHO_MAX_DOC = 8 * 1024 * 1024 // 8 MB

export function validarPdf(arquivo: File): string | null {
  if (arquivo.type !== 'application/pdf') {
    return 'Formato não aceito. Envie um arquivo PDF.'
  }
  if (arquivo.size > TAMANHO_MAX_DOC) {
    return `O arquivo tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. O limite é 8 MB.`
  }
  return null
}

/**
 * Dev grava em public/uploads; produção usa Vercel Blob. A troca é via
 * STORAGE no ambiente para o painel funcionar igual nos dois.
 */
export async function salvarArquivo(arquivo: File): Promise<Salvo> {
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'application/pdf': 'pdf' }[arquivo.type] ?? 'bin'
  const chave = `${randomUUID()}.${ext}`
  const bytes = Buffer.from(await arquivo.arrayBuffer())

  if (process.env.STORAGE === 'blob') {
    const { put } = await import('@vercel/blob')
    const r = await put(chave, bytes, { access: 'public', contentType: arquivo.type })
    return { chave, url: r.url }
  }

  const dir = join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, chave), bytes)
  return { chave, url: `/uploads/${chave}` }
}

/**
 * Lê largura/altura do cabeçalho do arquivo. Sem isso o layout não
 * consegue reservar a caixa da imagem e a página pula durante o load.
 */
export function dimensoes(buf: Buffer): { largura: number; altura: number } | null {
  // PNG: IHDR nos bytes 16..24
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) }
  }

  // JPEG: percorre os segmentos até um SOF
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue }
      const marcador = buf[i + 1]
      // SOF0..SOF15, pulando DHT(c4), JPG(c8) e DAC(cc)
      if (marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc) {
        return { altura: buf.readUInt16BE(i + 5), largura: buf.readUInt16BE(i + 7) }
      }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }

  // WebP: VP8X / VP8 / VP8L. Cada variante guarda as dimensões em um
  // offset diferente, então o tamanho mínimo é conferido por variante —
  // um VP8X válido tem exatamente 30 bytes de cabeçalho.
  if (buf.length >= 16 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const tipo = buf.toString('ascii', 12, 16)
    if (tipo === 'VP8X' && buf.length >= 30) {
      return { largura: buf.readUIntLE(24, 3) + 1, altura: buf.readUIntLE(27, 3) + 1 }
    }
    if (tipo === 'VP8 ' && buf.length >= 30) {
      return { largura: buf.readUInt16LE(26) & 0x3fff, altura: buf.readUInt16LE(28) & 0x3fff }
    }
    if (tipo === 'VP8L' && buf.length >= 25) {
      const b = buf.readUInt32LE(21)
      return { largura: (b & 0x3fff) + 1, altura: ((b >> 14) & 0x3fff) + 1 }
    }
  }

  return null
}
