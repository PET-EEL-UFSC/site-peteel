export type Trecho = { texto: string; href?: string }

/**
 * Separa um texto em pedaços comuns e links http(s). Existe pra mostrar texto
 * digitado no painel com endereços clicáveis SEM aceitar HTML: o resultado
 * vira elementos React (que escapam tudo), e só endereços que o `URL`
 * reconhece como http/https ganham `href`. Nada de `javascript:` nem de
 * `dangerouslySetInnerHTML`.
 */
export function partirEmLinks(texto: string): Trecho[] {
  const trechos: Trecho[] = []
  let ultimo = 0

  for (const m of texto.matchAll(/https?:\/\/[^\s<>"']+/g)) {
    // pontuação colada no fim da frase não faz parte do endereço
    const url = m[0].replace(/[.,;:!?)\]]+$/, '')
    const inicio = m.index ?? 0

    let valido = false
    try {
      const u = new URL(url)
      valido = u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      valido = false
    }
    if (!valido) continue

    if (inicio > ultimo) trechos.push({ texto: texto.slice(ultimo, inicio) })
    trechos.push({ texto: url, href: url })
    ultimo = inicio + url.length
  }

  if (ultimo < texto.length) trechos.push({ texto: texto.slice(ultimo) })
  return trechos
}
