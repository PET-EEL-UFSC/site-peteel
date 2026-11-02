'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { blocosSchema } from '@/lib/content/blocos'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { emailSchema, slugReservado } from '@/lib/auth/acesso'
import { lerListaAlunos, slugDeTitulo } from '@/lib/minicursos'
import { apagarArquivo } from '@/lib/storage'
import { validarCertificadoNoBlob } from '@/lib/certificado'

export type Resultado = { ok: true; mensagem: string } | { ok: false; erro: string }

// ─────────────────────────── páginas ───────────────────────────

export async function salvarRascunho(paginaId: string, blocos: unknown): Promise<Resultado> {
  try {
    await exigirPermissaoAction('editarRascunho')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const r = blocosSchema.safeParse(blocos)
  if (!r.success) {
    const i = r.error.issues[0]
    return { ok: false, erro: `bloco inválido: ${i.message} (${i.path.join('.')})` }
  }

  await db.pagina.update({ where: { id: paginaId }, data: { rascunho: r.data } })
  revalidatePath(`/admin/paginas/${paginaId}`)
  return { ok: true, mensagem: 'Rascunho salvo.' }
}

export async function publicar(paginaId: string, blocos: unknown): Promise<Resultado> {
  let usuario
  try {
    usuario = await exigirPermissaoAction('publicar')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const r = blocosSchema.safeParse(blocos)
  if (!r.success) {
    const i = r.error.issues[0]
    return { ok: false, erro: `bloco inválido: ${i.message} (${i.path.join('.')})` }
  }

  const pagina = await db.pagina.findUnique({ where: { id: paginaId }, select: { slug: true, blocos: true } })
  if (!pagina) return { ok: false, erro: 'página não encontrada' }

  await db.$transaction([
    // guarda o que estava no ar antes de sobrescrever
    db.paginaRevisao.create({
      data: { paginaId, blocos: pagina.blocos ?? [], resumo: 'versão anterior à publicação', autorId: usuario.id },
    }),
    db.pagina.update({
      where: { id: paginaId },
      data: { blocos: r.data, rascunho: Prisma.JsonNull, status: 'PUBLICADA' },
    }),
  ])

  revalidatePath(pagina.slug)
  revalidatePath('/admin')
  revalidatePath(`/admin/paginas/${paginaId}`)
  // publicar pode trocar o status pra "no ar" — isso muda quem entra
  // no menu, então o layout do site (header/footer) precisa invalidar
  revalidatePath('/', 'layout')
  return { ok: true, mensagem: 'Publicado.' }
}

export async function descartarRascunho(paginaId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('editarRascunho')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
  await db.pagina.update({ where: { id: paginaId }, data: { rascunho: Prisma.JsonNull } })
  revalidatePath(`/admin/paginas/${paginaId}`)
  return { ok: true, mensagem: 'Rascunho descartado.' }
}

export async function restaurarRevisao(revisaoId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('publicar')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const rev = await db.paginaRevisao.findUnique({ where: { id: revisaoId } })
  if (!rev) return { ok: false, erro: 'revisão não encontrada' }

  // vai para o rascunho, não direto para o ar — restaurar é uma proposta,
  // publicar continua sendo um ato deliberado
  await db.pagina.update({ where: { id: rev.paginaId }, data: { rascunho: rev.blocos ?? [] } })
  revalidatePath(`/admin/paginas/${rev.paginaId}`)
  return { ok: true, mensagem: 'Revisão carregada no rascunho. Revise e publique.' }
}

export async function criarPagina(formData: FormData): Promise<void> {
  await exigirPermissaoAction('criarPagina')

  const titulo = String(formData.get('titulo') ?? '').trim()
  let slug = String(formData.get('slug') ?? '').trim().toLowerCase()
  if (!slug.startsWith('/')) slug = '/' + slug
  slug = slug.replace(/\s+/g, '-').replace(/[^a-z0-9/-]/g, '')

  if (!titulo || slug === '/') throw new Error('título e endereço são obrigatórios')
  if (slugReservado(slug)) throw new Error(`o endereço ${slug} é reservado pelo sistema; escolha outro`)

  const existe = await db.pagina.findUnique({ where: { slug }, select: { id: true } })
  if (existe) throw new Error(`já existe uma página em ${slug}`)

  const paiIdRaw = String(formData.get('paiId') ?? '')
  const pagina = await db.pagina.create({
    data: {
      slug,
      titulo,
      paiId: paiIdRaw || null,
      status: 'RASCUNHO',
      blocos: [
        {
          id: crypto.randomUUID(),
          tipo: 'cabecalho',
          migalha: titulo,
          titulo,
          fundo: 'amarelo',
          decor: null,
        },
      ],
    },
  })

  revalidatePath('/admin')
  redirect(`/admin/paginas/${pagina.id}`)
}

export type ResultadoPagina = { ok: true; mensagem: string; titulo: string; slug: string } | { ok: false; erro: string }

/**
 * Nome, endereço, hierarquia e posição no menu — tudo que não é bloco de
 * conteúdo mas ainda assim define a página. Mesma permissão de criar:
 * quem já escolhe endereço na criação pode corrigir depois.
 */
export async function atualizarPagina(
  paginaId: string,
  dados: { titulo: string; slug: string; paiId: string | null; ordem: number; noMenu: boolean; minicursoId: string | null }
): Promise<ResultadoPagina> {
  try {
    await exigirPermissaoAction('criarPagina')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const atual = await db.pagina.findUnique({
    where: { id: paginaId },
    select: { slug: true, fixa: true, _count: { select: { filhos: true } } },
  })
  if (!atual) return { ok: false, erro: 'página não encontrada' }

  const titulo = dados.titulo.trim()
  if (!titulo) return { ok: false, erro: 'título é obrigatório' }

  const data: Prisma.PaginaUpdateInput = { titulo, ordem: dados.ordem, noMenu: dados.noMenu }

  // Vincular a um minicurso tira a página do site público e a leva pra
  // área do aluno. Home e mapa são páginas fixas do site aberto: nunca.
  const minicursoId = dados.minicursoId || null
  if (minicursoId) {
    if (atual.fixa) return { ok: false, erro: 'página fixa do site não pode ser restrita a alunos' }
    const m = await db.minicurso.findUnique({ where: { id: minicursoId }, select: { id: true } })
    if (!m) return { ok: false, erro: 'minicurso não encontrado' }
  }
  data.minicurso = minicursoId ? { connect: { id: minicursoId } } : { disconnect: true }
  let slugFinal = atual.slug

  // página fixa (home, mapa do site): endereço e hierarquia ficam travados
  // porque outras partes do código dependem desses valores específicos
  if (!atual.fixa) {
    let slug = dados.slug.trim().toLowerCase()
    if (!slug.startsWith('/')) slug = '/' + slug
    slug = slug.replace(/\s+/g, '-').replace(/[^a-z0-9/-]/g, '')
    if (slug === '/') return { ok: false, erro: 'endereço é obrigatório' }
    if (slugReservado(slug)) return { ok: false, erro: `o endereço ${slug} é reservado pelo sistema; escolha outro` }

    if (slug !== atual.slug) {
      const existe = await db.pagina.findUnique({ where: { slug }, select: { id: true } })
      if (existe) return { ok: false, erro: `já existe uma página em ${slug}` }
      data.slug = slug
      slugFinal = slug
    }

    const paiId = dados.paiId || null
    if (paiId === paginaId) return { ok: false, erro: 'uma página não pode ser filha de si mesma' }
    if (paiId && atual._count.filhos > 0) {
      return { ok: false, erro: 'esta página tem subpáginas; não pode virar filha de outra' }
    }
    if (paiId) {
      // o menu só tem um nível de aninhamento — a página-pai não pode
      // ela mesma ter pai, senão viraria neta e o header não mostra
      const pai = await db.pagina.findUnique({ where: { id: paiId }, select: { paiId: true } })
      if (!pai) return { ok: false, erro: 'página-pai não encontrada' }
      if (pai.paiId) return { ok: false, erro: 'só é possível aninhar um nível — escolha uma página que não tenha pai' }
    }
    data.pai = paiId ? { connect: { id: paiId } } : { disconnect: true }
  }

  await db.pagina.update({ where: { id: paginaId }, data })

  revalidatePath('/admin')
  revalidatePath(`/admin/paginas/${paginaId}`)
  revalidatePath(atual.slug)
  if (slugFinal !== atual.slug) revalidatePath(slugFinal)
  // nome, endereço, pai e "aparece no menu" alimentam o header/footer —
  // sem isso o menu fica com dado velho até o cache expirar sozinho
  revalidatePath('/', 'layout')

  return { ok: true, mensagem: 'Configurações salvas.', titulo, slug: slugFinal }
}

export async function apagarPagina(paginaId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('apagarPagina')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const p = await db.pagina.findUnique({ where: { id: paginaId }, select: { slug: true, fixa: true, titulo: true, _count: { select: { filhos: true } } } })
  if (!p) return { ok: false, erro: 'página não encontrada' }
  if (p.fixa) return { ok: false, erro: `"${p.titulo}" é uma página fixa do site e não pode ser apagada` }
  if (p._count.filhos > 0) return { ok: false, erro: 'esta página tem subpáginas; mova ou apague elas antes' }

  await db.pagina.delete({ where: { id: paginaId } })
  revalidatePath('/admin')
  revalidatePath(p.slug)
  // a página apagada pode ter estado no menu — sem isso o header/footer
  // continuam mostrando o link até o cache expirar sozinho
  revalidatePath('/', 'layout')
  return { ok: true, mensagem: 'Página apagada.' }
}

// ─────────────────────────── pessoas ───────────────────────────

export async function salvarPetiano(formData: FormData): Promise<void> {
  await exigirPermissaoAction('gerenciarPetianos')

  const id = String(formData.get('id') ?? '')
  const dados = {
    nome: String(formData.get('nome') ?? '').trim(),
    cargo: String(formData.get('cargo') ?? '').trim(),
    tutor: formData.get('tutor') === 'on',
    bio: String(formData.get('bio') ?? '').trim() || null,
    fotoId: String(formData.get('fotoId') ?? '') || null,
    linkedin: String(formData.get('linkedin') ?? '').trim() || null,
    email: String(formData.get('email') ?? '').trim() || null,
    saiuEm: formData.get('saiuEm') ? new Date(String(formData.get('saiuEm'))) : null,
    destino: String(formData.get('destino') ?? '').trim() || null,
    ordem: Number(formData.get('ordem') ?? 0),
  }
  if (!dados.nome || !dados.cargo) throw new Error('nome e cargo são obrigatórios')
  if (dados.linkedin && !/^https?:\/\//.test(dados.linkedin)) {
    throw new Error('o link do LinkedIn precisa começar com http:// ou https://')
  }
  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    throw new Error('o e-mail parece inválido')
  }

  if (id) await db.petiano.update({ where: { id }, data: dados })
  else await db.petiano.create({ data: { ...dados, entrouEm: new Date() } })

  revalidatePath('/admin/pessoas')
  revalidatePath('/membros')
}

export async function apagarPetiano(id: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarPetianos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
  await db.petiano.delete({ where: { id } })
  revalidatePath('/admin/pessoas')
  revalidatePath('/membros')
  return { ok: true, mensagem: 'Removido.' }
}

export async function enviarCurriculo(petianoId: string, formData: FormData): Promise<Resultado> {
  let usuario
  try {
    usuario = await exigirPermissaoAction('gerenciarPetianos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const arquivo = formData.get('arquivo')
  if (!(arquivo instanceof File) || arquivo.size === 0) return { ok: false, erro: 'nenhum arquivo selecionado' }

  const { validarPdf, salvarArquivo } = await import('@/lib/storage')
  const problema = validarPdf(arquivo)
  if (problema) return { ok: false, erro: problema }

  let chave: string
  let url: string
  try {
    ;({ chave, url } = await salvarArquivo(arquivo))
  } catch (e) {
    console.error('Falha ao salvar currículo no storage:', e)
    return { ok: false, erro: 'não consegui salvar o arquivo no armazenamento — avisa o time técnico' }
  }

  const doc = await db.documento.create({
    data: { chave, url, nome: arquivo.name, tamanho: arquivo.size, enviadoPorId: usuario.id },
  })
  await db.petiano.update({ where: { id: petianoId }, data: { curriculoId: doc.id } })

  revalidatePath('/admin/pessoas')
  revalidatePath('/membros')
  return { ok: true, mensagem: 'Currículo enviado.' }
}

export async function removerCurriculo(petianoId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarPetianos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
  await db.petiano.update({ where: { id: petianoId }, data: { curriculoId: null } })
  revalidatePath('/admin/pessoas')
  revalidatePath('/membros')
  return { ok: true, mensagem: 'Currículo removido.' }
}

// ─────────────────────────── apresentações ───────────────────────────

export type ResultadoApresentacao =
  | { ok: true; id: string; nome: string }
  | { ok: false; erro: string }

/** Caminho sem Blob (dev): o arquivo passa pela Server Action e vai pro disco. */
export async function enviarApresentacao(formData: FormData): Promise<ResultadoApresentacao> {
  let usuario
  try {
    usuario = await exigirPermissaoAction('subirMidia')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const arquivo = formData.get('arquivo')
  if (!(arquivo instanceof File) || arquivo.size === 0) return { ok: false, erro: 'nenhum arquivo selecionado' }

  const { validarHtml, salvarArquivo } = await import('@/lib/storage')
  const problema = validarHtml(arquivo)
  if (problema) return { ok: false, erro: problema }

  let salvo
  try {
    // alguns navegadores mandam .html sem tipo; o storage escolhe a extensão pelo tipo
    salvo = await salvarArquivo(new File([arquivo], arquivo.name, { type: 'text/html' }))
  } catch (e) {
    console.error('Falha ao salvar apresentação no storage:', e)
    return { ok: false, erro: 'não consegui salvar o arquivo no armazenamento — avisa o time técnico' }
  }

  const ap = await db.apresentacao.create({
    data: { chave: salvo.chave, url: salvo.url, nome: arquivo.name, tamanho: arquivo.size, enviadoPorId: usuario.id },
  })
  return { ok: true, id: ap.id, nome: ap.nome }
}

/**
 * Caminho com Blob (produção): o navegador já mandou o arquivo direto pro
 * Blob (pra fugir do teto de 4,5 MB de Server Action) e só avisa aqui.
 * A URL vem do cliente, então só aceita endereço do nosso próprio Blob —
 * senão qualquer link externo viraria "apresentação" servida pelo site.
 */
export async function registrarApresentacao(dados: { url: string; chave: string; nome: string; tamanho: number }): Promise<ResultadoApresentacao> {
  let usuario
  try {
    usuario = await exigirPermissaoAction('subirMidia')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  let host: string
  try {
    const u = new URL(dados.url)
    if (u.protocol !== 'https:') throw new Error('protocolo')
    host = u.hostname
  } catch {
    return { ok: false, erro: 'endereço do arquivo inválido' }
  }
  if (!host.endsWith('.public.blob.vercel-storage.com')) return { ok: false, erro: 'o arquivo precisa estar no armazenamento do site' }

  const { validarHtml } = await import('@/lib/storage')
  const problema = validarHtml({ name: dados.nome, type: 'text/html', size: dados.tamanho })
  if (problema) return { ok: false, erro: problema }

  const ap = await db.apresentacao.create({
    data: { chave: dados.chave, url: dados.url, nome: dados.nome.slice(0, 200), tamanho: dados.tamanho, enviadoPorId: usuario.id },
  })
  return { ok: true, id: ap.id, nome: ap.nome }
}

// ─────────────────────────── minicursos ───────────────────────────

export type ResultadoLista =
  | { ok: true; mensagem: string; avisos: string[] }
  | { ok: false; erro: string }

/**
 * Apaga quem ficou sem inscrição em nenhum minicurso: a linha de Aluno e a
 * conta de login (só as de papel ALUNO, nunca uma de admin/editor). Dado
 * pessoal que ninguém mais usa não fica parado no banco, e apagar a conta
 * derruba as sessões abertas junto.
 */
async function removerAlunosSemInscricao(): Promise<void> {
  const orfaos = await db.aluno.findMany({ where: { inscricoes: { none: {} } }, select: { id: true, email: true } })
  if (orfaos.length === 0) return
  await db.$transaction([
    db.user.deleteMany({ where: { email: { in: orfaos.map((a) => a.email) }, papel: 'ALUNO' } }),
    db.aluno.deleteMany({ where: { id: { in: orfaos.map((a) => a.id) } } }),
  ])
}

function cargaValida(h: number | null): boolean {
  return h === null || (Number.isInteger(h) && h >= 1 && h <= 1000)
}

export async function criarMinicurso(dados: { titulo: string; cargaHoraria: number | null }): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const titulo = dados.titulo.trim()
  if (titulo.length < 3 || titulo.length > 100) return { ok: false, erro: 'o nome precisa ter de 3 a 100 letras' }
  if (!cargaValida(dados.cargaHoraria)) return { ok: false, erro: 'carga horária inválida (de 1 a 1000 horas)' }

  const base = slugDeTitulo(titulo) || 'minicurso'
  let slug = base
  for (let n = 2; await db.minicurso.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`

  await db.minicurso.create({ data: { titulo, slug, cargaHoraria: dados.cargaHoraria } })
  revalidatePath('/admin/minicursos')
  return { ok: true, mensagem: 'Minicurso criado.' }
}

export async function atualizarMinicurso(
  id: string,
  dados: { titulo: string; cargaHoraria: number | null; ativo: boolean }
): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const titulo = dados.titulo.trim()
  if (titulo.length < 3 || titulo.length > 100) return { ok: false, erro: 'o nome precisa ter de 3 a 100 letras' }
  if (!cargaValida(dados.cargaHoraria)) return { ok: false, erro: 'carga horária inválida (de 1 a 1000 horas)' }

  await db.minicurso.update({ where: { id }, data: { titulo, cargaHoraria: dados.cargaHoraria, ativo: dados.ativo } })
  revalidatePath('/admin/minicursos')
  return { ok: true, mensagem: 'Minicurso atualizado.' }
}

export async function apagarMinicurso(id: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('apagarMinicurso')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  // Sem isso as páginas do minicurso passariam a ser públicas. O banco
  // também recusa (onDelete Restrict), mas aqui a mensagem diz o que fazer.
  const paginas = await db.pagina.count({ where: { minicursoId: id } })
  if (paginas > 0) {
    return { ok: false, erro: `há ${paginas} página(s) vinculada(s) a este minicurso; apague ou desvincule antes (em Configurações da página)` }
  }

  const certificados = await db.inscricao.findMany({
    where: { minicursoId: id, certificadoUrl: { not: null } },
    select: { certificadoUrl: true },
  })
  await db.minicurso.delete({ where: { id } })
  for (const c of certificados) if (c.certificadoUrl) await apagarArquivo(c.certificadoUrl)
  await removerAlunosSemInscricao()
  revalidatePath('/admin/minicursos')
  return { ok: true, mensagem: 'Minicurso apagado.' }
}

/**
 * Inscreve uma lista de pessoas ("e-mail, nome, matrícula" por linha).
 * Quem já existe como aluno mantém nome e matrícula como estão: digitar o
 * e-mail de alguém aqui não pode reescrever o nome que sai no certificado
 * de outro minicurso. Tudo em lote (poucas queries), pra lista grande não
 * demorar no banco remoto.
 */
export async function adicionarAlunos(minicursoId: string, texto: string): Promise<ResultadoLista> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const minicurso = await db.minicurso.findUnique({ where: { id: minicursoId }, select: { id: true } })
  if (!minicurso) return { ok: false, erro: 'minicurso não encontrado' }

  const { alunos, erros } = lerListaAlunos(texto)
  if (alunos.length === 0) {
    return { ok: false, erro: erros.length ? erros.slice(0, 5).join('; ') : 'cole pelo menos uma pessoa (e-mail, nome, matrícula)' }
  }

  const emails = alunos.map((a) => a.email)
  const existentes = await db.aluno.findMany({ where: { email: { in: emails } } })
  const porEmail = new Map(existentes.map((a) => [a.email, a]))

  const novos = alunos.filter((a) => !porEmail.has(a.email))
  if (novos.length) {
    await db.aluno.createMany({
      data: novos.map((a) => ({ email: a.email, nome: a.nome, matricula: a.matricula })),
      skipDuplicates: true,
    })
  }

  // reinscrever alguém desativado reativa; matrícula só preenche se estava vazia
  const reativar = existentes.filter((a) => !a.ativo).map((a) => a.id)
  if (reativar.length) await db.aluno.updateMany({ where: { id: { in: reativar } }, data: { ativo: true } })
  for (const a of alunos) {
    const ex = porEmail.get(a.email)
    if (ex && !ex.matricula && a.matricula) await db.aluno.update({ where: { id: ex.id }, data: { matricula: a.matricula } })
  }

  const todos = await db.aluno.findMany({ where: { email: { in: emails } }, select: { id: true } })
  const jaInscritos = await db.inscricao.findMany({
    where: { minicursoId, alunoId: { in: todos.map((a) => a.id) } },
    select: { alunoId: true },
  })
  const inscritos = new Set(jaInscritos.map((i) => i.alunoId))
  const novas = todos.filter((a) => !inscritos.has(a.id))
  if (novas.length) {
    await db.inscricao.createMany({
      data: novas.map((a) => ({ alunoId: a.id, minicursoId })),
      skipDuplicates: true,
    })
  }

  revalidatePath('/admin/minicursos')
  const ja = alunos.length - novas.length
  return {
    ok: true,
    mensagem: `${novas.length} inscrição(ões) criada(s)${ja ? `, ${ja} já estava(m) inscrita(s)` : ''}.`,
    avisos: erros,
  }
}

export async function removerInscricao(inscricaoId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const insc = await db.inscricao.findUnique({ where: { id: inscricaoId }, select: { certificadoUrl: true } })
  await db.inscricao.delete({ where: { id: inscricaoId } })
  if (insc?.certificadoUrl) await apagarArquivo(insc.certificadoUrl)
  await removerAlunosSemInscricao()
  revalidatePath('/admin/minicursos')
  return { ok: true, mensagem: 'Inscrição removida.' }
}

export type ResultadoCertificado = { ok: true; mensagem: string; nome: string } | { ok: false; erro: string }

/**
 * Guarda o PDF na inscrição e apaga o anterior do storage: certificado tem
 * nome de aluno, então versão trocada não pode ficar parada num link antigo.
 */
async function gravarCertificado(
  inscricaoId: string,
  arq: { chave: string; url: string; nome: string }
): Promise<ResultadoCertificado> {
  const atual = await db.inscricao.findUnique({ where: { id: inscricaoId }, select: { certificadoUrl: true } })
  if (!atual) {
    await apagarArquivo(arq.url)
    return { ok: false, erro: 'inscrição não encontrada' }
  }

  await db.inscricao.update({
    where: { id: inscricaoId },
    data: { certificadoEm: new Date(), certificadoChave: arq.chave, certificadoUrl: arq.url, certificadoNome: arq.nome.slice(0, 200) },
  })
  if (atual.certificadoUrl) await apagarArquivo(atual.certificadoUrl)

  revalidatePath('/admin/minicursos', 'layout')
  return { ok: true, mensagem: 'Certificado enviado.', nome: arq.nome }
}

/** Caminho sem Blob (dev): o PDF passa pela Server Action e vai pro disco. */
export async function enviarCertificado(inscricaoId: string, formData: FormData): Promise<ResultadoCertificado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const arquivo = formData.get('arquivo')
  if (!(arquivo instanceof File) || arquivo.size === 0) return { ok: false, erro: 'nenhum arquivo selecionado' }

  const { validarPdf, salvarArquivo } = await import('@/lib/storage')
  const problema = validarPdf(arquivo)
  if (problema) return { ok: false, erro: problema }
  // o tipo vem do navegador; conferir o cabeçalho do arquivo é barato
  if (Buffer.from(await arquivo.slice(0, 5).arrayBuffer()).toString('latin1') !== '%PDF-') {
    return { ok: false, erro: 'o arquivo não parece ser um PDF válido' }
  }

  let salvo
  try {
    salvo = await salvarArquivo(arquivo)
  } catch (e) {
    console.error('Falha ao salvar certificado no storage:', e)
    return { ok: false, erro: 'não consegui salvar o arquivo no armazenamento; avisa o time técnico' }
  }
  return gravarCertificado(inscricaoId, { chave: salvo.chave, url: salvo.url, nome: arquivo.name })
}

/**
 * Caminho com Blob (produção): o navegador já mandou o PDF direto pro Blob
 * (pra fugir do teto de 4,5 MB de Server Action) e só avisa aqui. Como a
 * URL vem do cliente, só vale arquivo que a rota de upload de certificado
 * emitiu (caminho com prefixo certificados/), no nosso Blob e ainda não
 * usado por outra inscrição. Sem isso, dava pra apontar um certificado pro
 * arquivo de outro aluno e, ao trocar, apagar o original.
 */
export async function registrarCertificado(
  inscricaoId: string,
  dados: { url: string; chave: string; nome: string; tamanho: number }
): Promise<ResultadoCertificado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const problema = validarCertificadoNoBlob(dados)
  if (problema) return { ok: false, erro: problema }

  const emUso = await db.inscricao.count({ where: { certificadoUrl: dados.url } })
  if (emUso > 0) return { ok: false, erro: 'este arquivo já está vinculado a outra inscrição' }

  return gravarCertificado(inscricaoId, { chave: dados.chave, url: dados.url, nome: dados.nome })
}

export async function removerCertificado(inscricaoId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarMinicursos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const atual = await db.inscricao.findUnique({ where: { id: inscricaoId }, select: { certificadoUrl: true } })
  if (!atual) return { ok: false, erro: 'inscrição não encontrada' }

  await db.inscricao.update({
    where: { id: inscricaoId },
    data: { certificadoEm: null, certificadoChave: null, certificadoUrl: null, certificadoNome: null },
  })
  if (atual.certificadoUrl) await apagarArquivo(atual.certificadoUrl)

  revalidatePath('/admin/minicursos', 'layout')
  return { ok: true, mensagem: 'Certificado removido.' }
}

// ─────────────────────────── acessos ───────────────────────────

export async function convidar(formData: FormData): Promise<Resultado> {
  let eu
  try {
    eu = await exigirPermissaoAction('gerenciarAcessos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const parsed = emailSchema.safeParse(String(formData.get('email') ?? ''))
  if (!parsed.success) return { ok: false, erro: 'e-mail inválido' }

  const papel = String(formData.get('papel') ?? 'EDITOR') === 'ADMIN' ? 'ADMIN' : 'EDITOR'
  const nome = String(formData.get('nome') ?? '').trim() || null
  const gestao = String(formData.get('gestao') ?? '').trim() || null

  const jaExiste = await db.user.findUnique({ where: { email: parsed.data }, select: { id: true } })

  await db.user.upsert({
    where: { email: parsed.data },
    // não sobrescreve o nome com vazio se a pessoa já existe
    update: { papel, ativo: true, ...(nome ? { nome } : {}), ...(gestao ? { gestao } : {}) },
    create: { email: parsed.data, nome, gestao, papel, ativo: true, convidadoPorId: eu.id },
  })

  revalidatePath('/admin/acessos')
  return {
    ok: true,
    mensagem: jaExiste
      ? `${parsed.data} já tinha acesso — dados atualizados.`
      : `${parsed.data} agora pode entrar com o Google.`,
  }
}

/** Nome e gestão são digitados aqui; o Google só preenche o nome se vier vazio. */
export async function atualizarAcesso(
  userId: string,
  dados: { nome: string; gestao: string }
): Promise<Resultado> {
  try {
    await exigirPermissaoAction('gerenciarAcessos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  await db.user.update({
    where: { id: userId },
    data: { nome: dados.nome.trim() || null, gestao: dados.gestao.trim() || null },
  })

  revalidatePath('/admin/acessos')
  return { ok: true, mensagem: 'Dados atualizados.' }
}

/**
 * Apaga o acesso de vez, em vez de só desativar.
 *
 * É seguro porque o histórico não depende da linha: revisão e mídia
 * guardam o autor com onDelete SetNull, então o que a pessoa publicou
 * continua lá, só perde a assinatura. Sessões e vínculo com o Google
 * caem junto (Cascade), então a pessoa é deslogada na hora.
 */
export async function apagarAcesso(userId: string): Promise<Resultado> {
  let eu
  try {
    eu = await exigirPermissaoAction('gerenciarAcessos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  if (userId === eu.id) return { ok: false, erro: 'você não pode apagar o próprio acesso' }

  const alvo = await db.user.findUnique({ where: { id: userId }, select: { papel: true, ativo: true, email: true } })
  if (!alvo) return { ok: false, erro: 'acesso não encontrado' }

  if (alvo.papel === 'ADMIN' && alvo.ativo) {
    const admins = await db.user.count({ where: { papel: 'ADMIN', ativo: true } })
    if (admins <= 1) return { ok: false, erro: 'este é o único admin ativo; promova outra pessoa antes' }
  }

  await db.user.delete({ where: { id: userId } })
  revalidatePath('/admin/acessos')
  return { ok: true, mensagem: `Acesso de ${alvo.email} apagado.` }
}

export async function alternarAcesso(userId: string, ativo: boolean): Promise<Resultado> {
  let eu
  try {
    eu = await exigirPermissaoAction('gerenciarAcessos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  // desligar o próprio acesso tranca a pessoa para fora na hora
  if (userId === eu.id && !ativo) return { ok: false, erro: 'você não pode desativar o próprio acesso' }

  if (!ativo) {
    const admins = await db.user.count({ where: { papel: 'ADMIN', ativo: true } })
    const alvo = await db.user.findUnique({ where: { id: userId }, select: { papel: true } })
    if (alvo?.papel === 'ADMIN' && admins <= 1) {
      return { ok: false, erro: 'este é o único admin ativo; promova outra pessoa antes' }
    }
  }

  await db.user.update({ where: { id: userId }, data: { ativo } })
  // a sessão é consultada no banco a cada carregamento do painel, então
  // desativar tem efeito imediato sem precisar invalidar sessão
  revalidatePath('/admin/acessos')
  return { ok: true, mensagem: ativo ? 'Acesso liberado.' : 'Acesso desativado.' }
}

export async function mudarPapel(userId: string, papel: 'ADMIN' | 'EDITOR'): Promise<Resultado> {
  let eu
  try {
    eu = await exigirPermissaoAction('gerenciarAcessos')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  if (userId === eu.id && papel === 'EDITOR') {
    const admins = await db.user.count({ where: { papel: 'ADMIN', ativo: true } })
    if (admins <= 1) return { ok: false, erro: 'você é o único admin; promova outra pessoa antes de se rebaixar' }
  }

  await db.user.update({ where: { id: userId }, data: { papel } })
  revalidatePath('/admin/acessos')
  return { ok: true, mensagem: 'Papel atualizado.' }
}

// ─────────────────────────── configuração ───────────────────────────

export async function salvarConfig(formData: FormData): Promise<void> {
  await exigirPermissaoAction('configurarSite')

  const t = (k: string) => String(formData.get(k) ?? '').trim() || null
  await db.config.upsert({
    where: { id: 1 },
    update: {
      nomeSite: String(formData.get('nomeSite') ?? 'PET EEL').trim(),
      descricao: String(formData.get('descricao') ?? '').trim(),
      endereco: t('endereco'), telefone: t('telefone'), email: t('email'),
      instagram: t('instagram'), linkedin: t('linkedin'), facebook: t('facebook'), spotify: t('spotify'),
      avisoAtivo: formData.get('avisoAtivo') === 'on',
      avisoTexto: t('avisoTexto'), avisoLink: t('avisoLink'),
    },
    create: { id: 1, nomeSite: String(formData.get('nomeSite') ?? 'PET EEL').trim() },
  })

  revalidatePath('/', 'layout')
  revalidatePath('/admin/config')
}

// ─────────────────────────── mídia ───────────────────────────

export async function enviarImagem(formData: FormData): Promise<Resultado> {
  let usuario
  try {
    usuario = await exigirPermissaoAction('subirMidia')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  // rede de segurança: qualquer falha não prevista aqui embaixo vira
  // aviso amigável em vez de estourar sem tratamento pro navegador —
  // era assim que um upload virava "erro genérico" sem explicação
  try {
    const { validarImagem, salvarArquivo, dimensoes } = await import('@/lib/storage')

    const arquivo = formData.get('arquivo')
    if (!(arquivo instanceof File) || arquivo.size === 0) return { ok: false, erro: 'nenhum arquivo escolhido' }

    const alt = String(formData.get('alt') ?? '').trim()
    // alt obrigatório: sem ele o site não é acessível, e o PET é um
    // programa de ensino público
    if (alt.length < 3) return { ok: false, erro: 'descreva a imagem em poucas palavras — é o que leitores de tela leem' }

    const problema = validarImagem(arquivo)
    if (problema) return { ok: false, erro: problema }

    const buf = Buffer.from(await arquivo.arrayBuffer())
    const dim = dimensoes(buf) ?? { largura: 1200, altura: 900 }

    let chave: string
    let url: string
    try {
      ;({ chave, url } = await salvarArquivo(arquivo))
    } catch (e) {
      console.error('Falha ao salvar imagem no storage:', e)
      return { ok: false, erro: 'não consegui salvar a imagem no armazenamento — avisa o time técnico' }
    }

    try {
      await db.midia.create({
        data: { chave, url, alt, largura: dim.largura, altura: dim.altura, tamanho: arquivo.size, mimeType: arquivo.type, enviadoPorId: usuario.id },
      })
    } catch (e) {
      console.error('Falha ao registrar imagem no banco:', e)
      return { ok: false, erro: 'a imagem foi enviada mas não consegui registrar ela no banco — avisa o time técnico' }
    }

    revalidatePath('/admin/midia')
    return { ok: true, mensagem: 'Imagem enviada.' }
  } catch (e) {
    console.error('Falha inesperada ao enviar imagem:', e)
    return { ok: false, erro: 'algo deu errado ao enviar a imagem — tenta de novo daqui a pouco. Se continuar, avisa o time técnico.' }
  }
}

export async function apagarImagem(id: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('subirMidia')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  // Com blocos em JSONB, saber se a foto está em uso exige varrer as
  // páginas. São dezenas de linhas, então sai barato — e apagar uma
  // imagem publicada deixaria buraco no site.
  const emUso = await db.pagina.findMany({
    where: { OR: [{ blocos: { string_contains: id } }, { rascunho: { string_contains: id } }] },
    select: { titulo: true },
    take: 5,
  })
  if (emUso.length > 0) {
    return { ok: false, erro: `esta imagem está em uso em: ${emUso.map((p) => p.titulo).join(', ')}` }
  }

  const usada = await db.petiano.count({ where: { fotoId: id } })
  if (usada > 0) return { ok: false, erro: 'esta imagem é a foto de um petiano' }

  await db.midia.delete({ where: { id } })
  revalidatePath('/admin/midia')
  return { ok: true, mensagem: 'Imagem apagada.' }
}
