import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'
import { Acessos } from '../_componentes/Acessos'

export default async function AcessosPage() {
  const eu = await exigirPermissao('gerenciarAcessos')

  // Alunos de minicurso têm conta (papel ALUNO) mas não são acesso ao painel:
  // vivem em Minicursos e não entram nesta lista nem nas ações dela.
  const usuarios = await db.user.findMany({
    where: { papel: { not: 'ALUNO' } },
    select: { id: true, email: true, nome: true, papel: true, ativo: true, gestao: true, primeiroAcesso: true, criadoEm: true },
    orderBy: [{ ativo: 'desc' }, { papel: 'asc' }, { criadoEm: 'asc' }],
  })

  return (
    <>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>Acessos</h1>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '64ch' }}>
        Só quem está nesta lista consegue entrar no painel. Adicione a pessoa <strong>antes</strong> do primeiro login dela —
        entrar com o Google não basta, o acesso vem daqui.
      </p>
      <Acessos
        meuId={eu.id}
        usuarios={usuarios.flatMap((u) =>
          u.papel === 'ALUNO'
            ? []
            : [
                {
                  ...u,
                  papel: u.papel,
                  criadoEm: u.criadoEm.toISOString(),
                  primeiroAcesso: u.primeiroAcesso ? u.primeiroAcesso.toISOString() : null,
                },
              ]
        )}
      />
    </>
  )
}
