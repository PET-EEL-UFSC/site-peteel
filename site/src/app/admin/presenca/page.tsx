import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'

export default async function PresencaPage() {
  const eu = await exigirPermissao('registrarPresenca')

  // administrador vê todas as turmas; editor, só as que ministra
  const turmas = await db.minicurso.findMany({
    where: eu.papel === 'ADMIN' ? {} : { ministrantes: { some: { userId: eu.id } } },
    orderBy: { criadoEm: 'desc' },
    select: { id: true, titulo: true, ativo: true, _count: { select: { inscricoes: true, encontros: true } } },
  })

  return (
    <>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>Presença</h1>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '62ch' }}>
        {eu.papel === 'ADMIN'
          ? 'Todas as turmas. Pra uma pessoa do grupo marcar presença, defina-a como ministrante no cartão do minicurso.'
          : 'As turmas em que você é ministrante. Falta alguma? Peça a quem organiza o minicurso pra te marcar como ministrante.'}
      </p>

      {turmas.length === 0 ? (
        <p className="dica">Nenhuma turma por aqui ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          {turmas.map((t) => (
            <Link key={t.id} href={`/admin/presenca/${t.id}`} className="cartao" style={{ display: 'block', padding: '16px 18px' }}>
              <strong style={{ font: '900 17px var(--condensada)', textTransform: 'uppercase' }}>{t.titulo}</strong>
              {!t.ativo && <span className="tag" style={{ marginLeft: 8 }}>inativo</span>}
              <div style={{ marginTop: 4, font: '400 13.5px var(--corpo)', color: 'rgba(44,43,34,0.65)' }}>
                {t._count.inscricoes} aluno(s) · {t._count.encontros} encontro(s)
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
