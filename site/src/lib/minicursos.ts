import { emailSchema, slugReservado } from '@/lib/auth/acesso'
import { blocosSchema, type Blocos } from '@/lib/content/blocos'

export function slugDeTitulo(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Endereço de uma aula: /<minicurso>/<aula>. Um minicurso chamado "Aluno" ou
 * "Admin" cairia num endereço reservado do sistema (e a página nunca abriria),
 * então ganha um prefixo.
 */
export function enderecoDeAula(slugDoMinicurso: string, tituloDaAula: string): string {
  const raiz = slugReservado('/' + slugDoMinicurso) ? `curso-${slugDoMinicurso}` : slugDoMinicurso
  return `/${raiz}/${slugDeTitulo(tituloDaAula) || 'aula'}`
}

/** Começo de uma aula nova: cabeçalho + uma faixa com instruções pra quem for editar. Já validado pelo schema. */
export function blocosIniciaisDeAula(tituloDoMinicurso: string, tituloDaAula: string): Blocos {
  return blocosSchema.parse([
    { id: crypto.randomUUID(), tipo: 'cabecalho', migalha: tituloDoMinicurso, titulo: tituloDaAula, fundo: 'amarelo', decor: null },
    {
      id: crypto.randomUUID(),
      tipo: 'faixa',
      fundo: 'offwhite',
      layout: '1-largo',
      alinhamento: 'start',
      espacamento: 'normal',
      decor: null,
      quadrantes: [
        [
          { tipo: 'titulo', texto: 'Material da aula', tamanho: 'm' },
          {
            tipo: 'paragrafo',
            texto: 'Escreva aqui o resumo da aula. Em "Adicionar conteúdo" dá pra incluir vídeo, apresentação, botões com link (ex.: repositório no GitHub) e mais.',
          },
        ],
      ],
    },
  ])
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
