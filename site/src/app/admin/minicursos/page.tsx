import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'
import { pode } from '@/lib/auth/acesso'
import { Minicursos } from '../_componentes/Minicursos'

export default async function MinicursosPage() {
  const eu = await exigirPermissao('gerenciarMinicursos')

  const minicursos = await db.minicurso.findMany({
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      cargaHoraria: true,
      ativo: true,
      paginas: {
        orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
        select: { id: true, titulo: true, status: true },
      },
      inscricoes: {
        orderBy: { aluno: { nome: 'asc' } },
        select: { id: true, certificadoEm: true, aluno: { select: { nome: true, email: true, matricula: true } } },
      },
    },
  })

  return (
    <>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>Minicursos</h1>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '68ch' }}>
        Quem estiver inscrito entra na Área do aluno com a conta Google do e-mail cadastrado aqui e vê as aulas do minicurso. As aulas
        são páginas feitas no editor de blocos (vídeo, apresentação, botões com link e mais), criadas em <strong>Aulas</strong>, dentro de cada
        minicurso. Os dados dos alunos
        (e-mail, matrícula) só aparecem nesta tela e pra própria pessoa, nunca no site público. Os certificados (PDF assinado) são enviados em{' '}
        <strong>Enviar certificados</strong>, dentro de cada minicurso.
      </p>
      <Minicursos
        podeApagar={pode(eu.papel, 'apagarMinicurso')}
        minicursos={minicursos.map((m) => ({
          id: m.id,
          titulo: m.titulo,
          descricao: m.descricao ?? '',
          cargaHoraria: m.cargaHoraria,
          ativo: m.ativo,
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
