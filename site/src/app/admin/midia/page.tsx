import { db } from '@/lib/db'
import { exigirUsuario } from '@/lib/auth/sessao'
import { Biblioteca } from '../_componentes/Biblioteca'

export default async function MidiaPage() {
  await exigirUsuario()
  const midias = await db.midia.findMany({
    select: { id: true, url: true, alt: true, largura: true, altura: true, tamanho: true, criadoEm: true },
    orderBy: { criadoEm: 'desc' },
  })

  return (
    <>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>Imagens</h1>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '60ch' }}>
        As fotos enviadas aqui aparecem para escolher nos blocos das páginas e nas fichas dos petianos.
      </p>
      <Biblioteca midias={midias.map((m) => ({ ...m, criadoEm: m.criadoEm.toISOString() }))} />
    </>
  )
}
