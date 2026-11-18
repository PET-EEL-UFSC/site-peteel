/** Frequência em %, com uma casa decimal. Sem encontros, 0. */
export function percentualDePresenca(presencas: number, encontros: number): number {
  if (encontros <= 0) return 0
  return Math.round((presencas / encontros) * 1000) / 10
}

/**
 * Atingiu o mínimo? Compara em inteiros (presenças × 100 ≥ mínimo × encontros)
 * pra 3 de 4 encontros contar exatamente como 75%, sem erro de arredondamento.
 */
export function atingeFrequenciaMinima(presencas: number, encontros: number, minimoPercentual: number): boolean {
  return encontros > 0 && presencas * 100 >= minimoPercentual * encontros
}

/** "2026-11-16" → Date em UTC à meia-noite (coluna DATE do banco), ou null se não for uma data de verdade. */
export function lerDataISO(texto: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null
  const d = new Date(`${texto}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== texto) return null
  const ano = d.getUTCFullYear()
  return ano >= 2020 && ano <= 2100 ? d : null
}

/** Mostra uma data DATE do banco como dd/mm/aaaa, sem o fuso mudar o dia. */
export function formatarDataCurta(d: Date): string {
  const [a, m, dia] = d.toISOString().slice(0, 10).split('-')
  return `${dia}/${m}/${a}`
}
