import { PrismaClient } from '@prisma/client'
import { blocosSchema } from '../src/lib/content/blocos'
import { adminInicial } from '../src/lib/auth/acesso'
import { PAGINAS } from './seed-conteudo'

const db = new PrismaClient()

async function main() {
  // ── primeiro admin ──
  const email = adminInicial()
  if (!email) {
    console.warn('⚠  ADMIN_INICIAL não definido — nenhum admin criado. Ninguém vai conseguir entrar no painel.')
  } else {
    const u = await db.user.upsert({
      where: { email },
      update: { papel: 'ADMIN', ativo: true },
      create: { email, papel: 'ADMIN', ativo: true, nome: 'Administrador' },
    })
    console.log(`✔ admin: ${u.email}`)
  }

  // ── configuração do site ──
  await db.config.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nomeSite: 'PET EEL',
      descricao: 'Programa de Educação Tutorial de Engenharia Elétrica — UFSC',
      endereco: '3º andar do CTC - UFSC, Florianópolis - SC',
      telefone: '(48) 3721-9729',
      email: 'peteel@gmail.com',
      instagram: 'https://instagram.com/peteel.ufsc',
      avisoAtivo: false,
      avisoTexto: 'Sexta, 12h10 — seminário semanal no CTC, sala divulgada nos stories',
      avisoLink: '/seminarios',
    },
  })
  console.log('✔ configuração do site')

  // ── páginas ──
  // Duas passadas: cria todas primeiro, depois liga os pais. Senão a
  // ordem do array teria que respeitar a hierarquia.
  for (const p of PAGINAS) {
    const r = blocosSchema.safeParse(p.blocos)
    if (!r.success) {
      console.error(`✗ ${p.slug}: blocos inválidos`)
      console.error(JSON.stringify(r.error.issues, null, 2))
      throw new Error(`seed abortado em ${p.slug}`)
    }

    await db.pagina.upsert({
      where: { slug: p.slug },
      update: { titulo: p.titulo, descricao: p.descricao, blocos: r.data, status: 'PUBLICADA', ordem: p.ordem ?? 0, noMenu: p.noMenu ?? true, fixa: p.fixa ?? false },
      create: {
        slug: p.slug,
        titulo: p.titulo,
        descricao: p.descricao,
        blocos: r.data,
        status: 'PUBLICADA',
        ordem: p.ordem ?? 0,
        noMenu: p.noMenu ?? true,
        fixa: p.fixa ?? false,
      },
    })
  }

  for (const p of PAGINAS) {
    if (!p.pai) continue
    const pai = await db.pagina.findUnique({ where: { slug: p.pai }, select: { id: true } })
    if (!pai) throw new Error(`pai não encontrado: ${p.pai}`)
    await db.pagina.update({ where: { slug: p.slug }, data: { paiId: pai.id } })
  }
  console.log(`✔ ${PAGINAS.length} páginas`)

  // ── equipe de exemplo ──
  if ((await db.petiano.count()) === 0) {
    const equipe = [
      { nome: 'Nome do tutor', cargo: 'Docente EEL', tutor: true, bio: 'Docente do Departamento de Engenharia Elétrica e Eletrônica, responsável pela orientação acadêmica do grupo.' },
      { nome: 'Petiano(a)', cargo: 'Coord. de Pesquisa', tutor: false },
      { nome: 'Petiano(a)', cargo: 'Coord. de Ensino', tutor: false },
      { nome: 'Petiano(a)', cargo: 'Coord. de Extensão', tutor: false },
      { nome: 'Petiano(a)', cargo: 'Comunicação', tutor: false },
      { nome: 'Petiano(a)', cargo: 'Connect', tutor: false },
      { nome: 'Petiano(a)', cargo: 'Projetos internos', tutor: false },
      { nome: 'Petiano(a)', cargo: 'VMC', tutor: false },
    ]
    await db.petiano.createMany({
      data: equipe.map((p, i) => ({ ...p, entrouEm: new Date('2026-03-01'), ordem: i })),
    })
    console.log(`✔ ${equipe.length} petianos de exemplo`)
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
