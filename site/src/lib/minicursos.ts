import { emailSchema } from '@/lib/auth/acesso'

export function slugDeTitulo(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export type AlunoLido = { email: string; nome: string; matricula: string | null }

export const MAX_ALUNOS_POR_ENVIO = 500

/**
 * Lê a lista colada no painel: uma pessoa por linha, "e-mail, nome, matrícula"
 * (matrícula é opcional). Aceita vírgula, ponto e vírgula ou tab, então dá
 * pra colar direto de uma planilha. Linha ruim vira erro com o número dela,
 * sem derrubar as outras.
 */
export function lerListaAlunos(texto: string): { alunos: AlunoLido[]; erros: string[] } {
  const alunos: AlunoLido[] = []
  const erros: string[] = []
  const vistos = new Set<string>()

  const linhas = texto.split(/\r?\n/)
  linhas.forEach((bruta, i) => {
    const linha = bruta.trim()
    if (!linha) return
    const n = i + 1

    const [emailBruto, nomeBruto, matriculaBruta] = linha.split(/[;,\t]/).map((p) => p.trim())

    const email = emailSchema.safeParse(emailBruto ?? '')
    if (!email.success) return void erros.push(`linha ${n}: e-mail inválido`)

    const nome = (nomeBruto ?? '').replace(/\s+/g, ' ')
    // 80 é o que cabe no certificado sem ficar ilegível
    if (nome.length < 2 || nome.length > 80) return void erros.push(`linha ${n}: falta o nome ou passa de 80 letras`)

    let matricula: string | null = null
    if (matriculaBruta) {
      if (!/^[A-Za-z0-9.-]{3,20}$/.test(matriculaBruta)) return void erros.push(`linha ${n}: matrícula inválida`)
      matricula = matriculaBruta
    }

    if (vistos.has(email.data)) return void erros.push(`linha ${n}: e-mail repetido na lista`)
    vistos.add(email.data)

    alunos.push({ email: email.data, nome, matricula })
  })

  if (alunos.length > MAX_ALUNOS_POR_ENVIO) {
    return { alunos: [], erros: [`no máximo ${MAX_ALUNOS_POR_ENVIO} pessoas por envio`] }
  }
  return { alunos, erros }
}
