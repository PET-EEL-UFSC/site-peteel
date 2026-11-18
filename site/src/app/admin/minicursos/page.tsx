import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'
import { pode } from '@/lib/auth/acesso'
import { Minicursos } from '../_componentes/Minicursos'

export default async function MinicursosPage() {
  const eu = await exigirPermissao('gerenciarMinicursos')

  const [minicursos, modelos, pessoas] = await Promise.all([
    db.minicurso.findMany({
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        slug: true,
        titulo: true,
        descricao: true,
        cargaHoraria: true,
        ativo: true,
        inscricoesAbertas: true,
        modeloCertificadoId: true,
        ministrantes: { select: { userId: true } },
        preInscricoes: {
          orderBy: { criadoEm: 'asc' },
          select: { id: true, nome: true, email: true, matricula: true },
        },
        paginas: {
          orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
          select: { id: true, titulo: true, status: true },
        },
        inscricoes: {
          orderBy: { aluno: { nome: 'asc' } },
          select: { id: true, certificadoEm: true, aluno: { select: { nome: true, email: true, matricula: true } } },
        },
      },
    }),
    db.modeloCertificado.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
    // ministrantes são pessoas do grupo: admin/editor ativos (aluno nunca)
    db.user.findMany({
      where: { ativo: true, papel: { in: ['ADMIN', 'EDITOR'] } },
      orderBy: [{ nome: 'asc' }, { email: 'asc' }],
      select: { id: true, nome: true, email: true },
    }),
  ])

  return (
    <>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>Minicursos</h1>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 12, maxWidth: '68ch' }}>
        Quem estiver inscrito entra na Área do aluno com a conta Google do e-mail cadastrado aqui e vê as aulas do minicurso. As aulas
        são páginas feitas no editor de blocos (vídeo, apresentação, botões com link e mais), criadas em <strong>Aulas</strong>, dentro de cada
        minicurso. Os dados dos alunos (e-mail, matrícula) só aparecem nesta tela e pra própria pessoa, nunca no site público. Os certificados
        saem do modelo do minicurso ou de um PDF enviado em <strong>Certificados</strong>, dentro de cada minicurso.
      </p>
      <p style={{ marginBottom: 22 }}>
        <Link href="/admin/minicursos/modelos" className="btn btn-claro">Modelos de certificado</Link>
      </p>
      <Minicursos
        podeApagar={pode(eu.papel, 'apagarMinicurso')}
        modelos={modelos.map((m) => ({ id: m.id, nome: m.nome }))}
        pessoas={pessoas.map((u) => ({ id: u.id, nome: u.nome ?? u.email }))}
        minicursos={minicursos.map((m) => ({
          id: m.id,
          slug: m.slug,
          titulo: m.titulo,
          descricao: m.descricao ?? '',
          cargaHoraria: m.cargaHoraria,
          ativo: m.ativo,
          inscricoesAbertas: m.inscricoesAbertas,
          modeloCertificadoId: m.modeloCertificadoId,
          ministrantes: m.ministrantes.map((x) => x.userId),
          pendentes: m.preInscricoes,
          aulas: m.paginas.map((a) => ({ id: a.id, titulo: a.titulo, publicada: a.status === 'PUBLICADA' })),
          inscricoes: m.inscricoes.map((i) => ({
            id: i.id,
            nome: i.aluno.nome,
            email: i.aluno.email,
            matricula: i.aluno.matricula,
            certificado: i.certificadoEm !== null,
          })),
        }))}
      />
    </>
  )
}
