import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { PALETA } from '@/lib/content/cores'
import { PAGINA, resolverTexto, dataPorExtenso, type Caixa } from '@/lib/certificado-modelo'

export type DadosCertificado = {
  nome: string
  minicurso: string
  cargaHoraria: number | null
  emitidoEm: Date
}

export type ModeloParaPdf = {
  /** bytes de um PNG ou JPG (a imagem de fundo); sem isso, fundo branco */
  fundo?: Uint8Array
  caixas: Caixa[]
}

const MAX_LINHAS_POR_CAIXA = 40

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

// letras comuns que não decompõem em "letra + acento" e ficam fora do Latin-1
const EQUIVALENTES: Record<string, string> = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', Ħ: 'H', ħ: 'h', ı: 'i' }

/**
 * As fontes padrão do PDF só cobrem Latin-1 (acentos do português, ok). Um
 * nome com letra fora disso faria o pdf-lib lançar erro e a pessoa ficaria
 * sem certificado. Troca só o caractere problemático.
 */
function seguro(fonte: PDFFont, texto: string): string {
  try {
    fonte.encodeText(texto)
    return texto
  } catch {
    return [...texto]
      .map((c) => {
        try {
          fonte.encodeText(c)
          return c
        } catch {
          const base = EQUIVALENTES[c] ?? c.normalize('NFD').replace(/[̀-ͯ]/g, '')
          try {
            fonte.encodeText(base)
            return base
          } catch {
            return '?'
          }
        }
      })
      .join('')
  }
}

function quebrar(fonte: PDFFont, texto: string, tamanho: number, largura: number): string[] {
  const linhas: string[] = []
  let atual = ''
  for (const palavra of texto.split(' ')) {
    const teste = atual ? `${atual} ${palavra}` : palavra
    if (atual && fonte.widthOfTextAtSize(teste, tamanho) > largura) {
      linhas.push(atual)
      atual = palavra
    } else {
      atual = teste
    }
  }
  if (atual) linhas.push(atual)
  return linhas
}

/** Maior tamanho (até `maximo`) em que o texto ainda cabe na largura; nunca abaixo de `minimo`. */
function ajustar(fonte: PDFFont, texto: string, maximo: number, minimo: number, largura: number): number {
  let t = maximo
  while (t > minimo && fonte.widthOfTextAtSize(texto, t) > largura) t -= 1
  return t
}

type Fontes = { sans: PDFFont; sansNegrito: PDFFont; serif: PDFFont; serifNegrito: PDFFont }

function desenharCaixa(pagina: PDFPage, c: Caixa, texto: string, fontes: Fontes) {
  const fonte = c.fonte === 'serif' ? (c.negrito ? fontes.serifNegrito : fontes.serif) : c.negrito ? fontes.sansNegrito : fontes.sans
  const larguraCaixa = (c.largura / 100) * PAGINA.largura
  const esquerda = (c.x / 100) * PAGINA.largura
  const topo = (c.y / 100) * PAGINA.altura

  let tamanho = c.tamanho
  let linhas: string[]
  if (c.encolher) {
    const t = seguro(fonte, texto.replace(/\s+/g, ' ').trim())
    tamanho = ajustar(fonte, t, c.tamanho, 8, larguraCaixa)
    linhas = [t]
  } else {
    linhas = texto
      .split('\n')
      .map((p) => seguro(fonte, p.replace(/[ \t]+/g, ' ').trim()))
      .flatMap((p) => (p ? quebrar(fonte, p, tamanho, larguraCaixa) : ['']))
      .slice(0, MAX_LINHAS_POR_CAIXA)
  }

  const entrelinha = tamanho * 1.25
  linhas.forEach((linha, i) => {
    if (!linha) return
    const w = fonte.widthOfTextAtSize(linha, tamanho)
    const x = c.alinhamento === 'centro' ? esquerda + (larguraCaixa - w) / 2 : c.alinhamento === 'direita' ? esquerda + larguraCaixa - w : esquerda
    // 0,9 ≈ distância do topo da linha até a linha de base
    const y = PAGINA.altura - topo - tamanho * 0.9 - i * entrelinha
    pagina.drawText(linha, { x, y, size: tamanho, font: fonte, color: hex(c.cor) })
  })
}

function ehPng(b: Uint8Array) {
  return b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
}
function ehJpg(b: Uint8Array) {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8
}

/**
 * Gera o PDF. Com `modelo`, desenha o fundo e as caixas de texto do modelo.
 * Sem modelo, usa o desenho padrão do site (faixa escura com a logo).
 */
export async function gerarCertificadoPdf(
  d: DadosCertificado,
  opcoes: { modelo?: ModeloParaPdf; logoPng?: Uint8Array } = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const pagina = pdf.addPage([PAGINA.largura, PAGINA.altura])
  const fontes: Fontes = {
    sans: await pdf.embedFont(StandardFonts.Helvetica),
    sansNegrito: await pdf.embedFont(StandardFonts.HelveticaBold),
    serif: await pdf.embedFont(StandardFonts.TimesRoman),
    serifNegrito: await pdf.embedFont(StandardFonts.TimesRomanBold),
  }

  pdf.setTitle(`Certificado: ${seguro(fontes.sansNegrito, d.minicurso)}`)
  pdf.setAuthor('PET EEL UFSC')
  pdf.setSubject('Certificado de participação em minicurso')

  if (opcoes.modelo) {
    const { fundo, caixas } = opcoes.modelo
    pagina.drawRectangle({ x: 0, y: 0, width: PAGINA.largura, height: PAGINA.altura, color: rgb(1, 1, 1) })
    if (fundo && (ehPng(fundo) || ehJpg(fundo))) {
      try {
        const img = ehPng(fundo) ? await pdf.embedPng(fundo) : await pdf.embedJpg(fundo)
        pagina.drawImage(img, { x: 0, y: 0, width: PAGINA.largura, height: PAGINA.altura })
      } catch {
        // imagem corrompida: o certificado sai sem fundo, mas sai
      }
    }
    for (const c of caixas) desenharCaixa(pagina, c, resolverTexto(c.texto, { ...d, data: d.emitidoEm }), fontes)
    return pdf.save()
  }

  await desenharPadrao(pdf, pagina, fontes, d, opcoes.logoPng)
  return pdf.save()
}

async function desenharPadrao(pdf: PDFDocument, pagina: PDFPage, fontes: Fontes, d: DadosCertificado, logoPng?: Uint8Array) {
  const { largura: W, altura: H } = PAGINA
  const escuro = hex(PALETA.escuro)
  const amarelo = hex(PALETA.amarelo)
  const claro = hex(PALETA.offwhite)
  const cinza = rgb(0.35, 0.35, 0.32)
  const nome = seguro(fontes.sansNegrito, d.nome)
  const curso = seguro(fontes.sansNegrito, d.minicurso)

  pagina.drawRectangle({ x: 0, y: 0, width: W, height: H, color: claro })

  const faixa = 104
  pagina.drawRectangle({ x: 0, y: H - faixa, width: W, height: faixa, color: escuro })
  pagina.drawRectangle({ x: 0, y: H - faixa - 6, width: W, height: 6, color: amarelo })

  let desenhouLogo = false
  if (logoPng && ehPng(logoPng)) {
    try {
      const img = await pdf.embedPng(logoPng)
      const alt = 46
      pagina.drawImage(img, { x: 48, y: H - faixa / 2 - alt / 2, width: (img.width / img.height) * alt, height: alt })
      desenhouLogo = true
    } catch {
      // logo é enfeite: sem ela o certificado sai igual, só com o texto
    }
  }
  if (!desenhouLogo) {
    pagina.drawText('PET EEL', { x: 48, y: H - faixa / 2 - 10, size: 28, font: fontes.sansNegrito, color: amarelo })
  }

  const grupo = 'PROGRAMA DE EDUCAÇÃO TUTORIAL · UFSC'
  pagina.drawText(grupo, { x: W - 48 - fontes.sans.widthOfTextAtSize(grupo, 10), y: H - faixa / 2 - 4, size: 10, font: fontes.sans, color: claro })

  const centro = (texto: string, f: PDFFont, tam: number, y: number, cor = escuro) =>
    pagina.drawText(texto, { x: (W - f.widthOfTextAtSize(texto, tam)) / 2, y, size: tam, font: f, color: cor })

  centro('CERTIFICADO', fontes.sansNegrito, 44, H - faixa - 78)
  centro('Certificamos que', fontes.sans, 16, H - faixa - 124, cinza)

  const tamNome = ajustar(fontes.sansNegrito, nome, 34, 14, W - 160)
  centro(nome, fontes.sansNegrito, tamNome, H - faixa - 172)
  pagina.drawRectangle({ x: W / 2 - 160, y: H - faixa - 184, width: 320, height: 3, color: amarelo })

  centro('participou do minicurso', fontes.sans, 16, H - faixa - 222, cinza)

  let y = H - faixa - 256
  for (const l of quebrar(fontes.sansNegrito, curso, 24, W - 200).slice(0, 3)) {
    centro(l, fontes.sansNegrito, 24, y)
    y -= 30
  }
  if (d.cargaHoraria) {
    centro(`com carga horária de ${d.cargaHoraria} ${d.cargaHoraria === 1 ? 'hora' : 'horas'}.`, fontes.sans, 16, y - 6, cinza)
  }

  centro(`Emitido em ${dataPorExtenso(d.emitidoEm)}`, fontes.sans, 12, 60, cinza)
}
