/**
 * Enquadramento de foto dentro de um quadro fixo (o card do petiano).
 *
 * Modelo: a foto cobre o quadro (object-fit: cover) e o "foco" (x, y em %)
 * diz qual ponto dela fica alinhado ao mesmo ponto do quadro, como no
 * object-position do CSS. O zoom amplia em torno desse mesmo ponto
 * (transform-origin igual ao foco), então mexer no zoom não faz a foto
 * "pular": o ponto de foco continua onde estava.
 */

export type Foco = { x: number; y: number; zoom: number } // x,y: 0–100 (uma casa decimal); zoom: 100–300 (%, inteiro)

export const FOCO_PADRAO: Foco = { x: 50, y: 50, zoom: 100 }

export function limitar(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** 0,1% é a menor unidade: com zoom alto, 1% inteiro vira vários pixels e o arrasto ficaria "em degraus". */
export function umaCasa(v: number): number {
  return Math.round(v * 10) / 10
}

/** Aceita qualquer coisa vinda de formulário/banco e devolve um foco válido (nos limites). */
export function normalizarFoco(c: { x?: unknown; y?: unknown; zoom?: unknown }): Foco {
  const num = (v: unknown, padrao: number) => {
    if (v === null || v === undefined || v === '') return padrao
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : padrao
  }
  return {
    x: limitar(umaCasa(num(c.x, FOCO_PADRAO.x)), 0, 100),
    y: limitar(umaCasa(num(c.y, FOCO_PADRAO.y)), 0, 100),
    zoom: limitar(Math.round(num(c.zoom, FOCO_PADRAO.zoom)), 100, 300),
  }
}

/** Estilo CSS do <img> que cobre o quadro, igual no site público e na prévia do painel. */
export function estiloDoFoco(f: Foco): { objectPosition: string; transform?: string; transformOrigin: string } {
  const origem = `${f.x}% ${f.y}%`
  return {
    objectPosition: origem,
    transformOrigin: origem,
    ...(f.zoom !== 100 ? { transform: `scale(${f.zoom / 100})` } : {}),
  }
}

/** Quanto a foto (cobrindo o quadro) sobra além dele em cada eixo, em px. */
export function sobraDaFoto(larguraFoto: number, alturaFoto: number, larguraQuadro: number, alturaQuadro: number) {
  const cobre = Math.max(larguraQuadro / larguraFoto, alturaQuadro / alturaFoto)
  return {
    x: Math.max(0, larguraFoto * cobre - larguraQuadro),
    y: Math.max(0, alturaFoto * cobre - alturaQuadro),
  }
}

/**
 * Novo valor do foco (%) num eixo depois de arrastar a foto `delta` px.
 *
 * Com zoom `s` e sobra `sobra`, a borda da foto fica em p/100 × K, com
 * K = quadro×(1−s) − s×sobra (sempre ≤ 0). Arrastar `delta` px move a borda
 * `delta` px, logo Δp = delta / K × 100: pra direita (delta > 0) o foco
 * diminui. Sem folga nenhuma no eixo (K ≈ 0), não há o que arrastar.
 */
export function focoPorArrasto(focoAtual: number, delta: number, quadro: number, sobra: number, zoom: number): number {
  const s = zoom / 100
  const K = quadro * (1 - s) - s * sobra
  if (Math.abs(K) < 0.5) return focoAtual
  return limitar(focoAtual + (delta / K) * 100, 0, 100)
}
