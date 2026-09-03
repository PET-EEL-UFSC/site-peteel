'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { blocosSchema } from '@/lib/content/blocos'
import { exigirPermissaoAction } from '@/lib/auth/sessao'
import { emailSchema } from '@/lib/auth/acesso'

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

export async function apagarPagina(paginaId: string): Promise<Resultado> {
  try {
    await exigirPermissaoAction('apagarPagina')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

  const p = await db.pagina.findUnique({ where: { id: paginaId }, select: { fixa: true, titulo: true, _count: { select: { filhos: true } } } })
  if (!p) return { ok: false, erro: 'página não encontrada' }
  if (p.fixa) return { ok: false, erro: `"${p.titulo}" é uma página fixa do site e não pode ser apagada` }
  if (p._count.filhos > 0) return { ok: false, erro: 'esta página tem subpáginas; mova ou apague elas antes' }

  await db.pagina.delete({ where: { id: paginaId } })
  revalidatePath('/admin')
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
    saiuEm: formData.get('saiuEm') ? new Date(String(formData.get('saiuEm'))) : null,
    destino: String(formData.get('destino') ?? '').trim() || null,
    ordem: Number(formData.get('ordem') ?? 0),
  }
  if (!dados.nome || !dados.cargo) throw new Error('nome e cargo são obrigatórios')
  if (dados.linkedin && !/^https?:\/\//.test(dados.linkedin)) {
    throw new Error('o link do LinkedIn precisa começar com http:// ou https://')
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
  try {
    await exigirPermissaoAction('subirMidia')
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }

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

  const usuario = await exigirPermissaoAction('subirMidia')
  await db.midia.create({
    data: { chave, url, alt, largura: dim.largura, altura: dim.altura, tamanho: arquivo.size, mimeType: arquivo.type, enviadoPorId: usuario.id },
  })

  revalidatePath('/admin/midia')
  return { ok: true, mensagem: 'Imagem enviada.' }
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
