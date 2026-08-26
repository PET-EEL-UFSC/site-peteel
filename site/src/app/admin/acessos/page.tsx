import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'
import { Acessos } from '../_componentes/Acessos'

export default async function AcessosPage() {
  const eu = await exigirPermissao('gerenciarAcessos')

  const usuarios = await db.user.findMany({
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
        usuarios={usuarios.map((u) => ({
          ...u,
          criadoEm: u.criadoEm.toISOString(),
          primeiroAcesso: u.primeiroAcesso ? u.primeiroAcesso.toISOString() : null,
        }))}
      />
    </>
  )
}
