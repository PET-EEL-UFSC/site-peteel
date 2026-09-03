import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'
import { Pessoas } from '../_componentes/Pessoas'

export default async function PessoasPage() {
  await exigirPermissao('gerenciarPetianos')

  const [petianos, midias] = await Promise.all([
    db.petiano.findMany({
      orderBy: [{ saiuEm: 'asc' }, { tutor: 'desc' }, { ordem: 'asc' }],
      include: { curriculo: { select: { url: true, nome: true } } },
    }),
    db.midia.findMany({ select: { id: true, url: true, alt: true }, orderBy: { criadoEm: 'desc' }, take: 200 }),
  ])

  return (
    <>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>Pessoas</h1>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '62ch' }}>
        Quem está aqui aparece no bloco de equipe das páginas. Quem tem data de saída passa para a lista de ex-PETianos.
      </p>
      <Pessoas
        petianos={petianos.map((p) => ({
          id: p.id, nome: p.nome, cargo: p.cargo, tutor: p.tutor, bio: p.bio,
          fotoId: p.fotoId, ordem: p.ordem, destino: p.destino, linkedin: p.linkedin,
          curriculo: p.curriculo,
          saiuEm: p.saiuEm ? p.saiuEm.toISOString().slice(0, 10) : null,
        }))}
        midias={midias}
      />
    </>
  )
}
