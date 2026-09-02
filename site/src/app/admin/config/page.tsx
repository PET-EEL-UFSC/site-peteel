import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth/sessao'
import { salvarConfig } from '../acoes'

export default async function ConfigPage() {
  await exigirPermissao('configurarSite')
  const c = await db.config.findUnique({ where: { id: 1 } })

  const campo = (nome: string, rotulo: string, valor: string | null | undefined, dica?: string, tipo = 'text') => (
    <label className="campo">
      <span>{rotulo}</span>
      <input type={tipo} name={nome} defaultValue={valor ?? ''} />
      {dica && <p className="dica">{dica}</p>}
    </label>
  )

  return (
    <>
      <h1 style={{ fontSize: 34, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>Configuração</h1>
      <p style={{ font: '400 14px/1.6 var(--corpo)', color: 'rgba(44,43,34,0.65)', marginBottom: 22, maxWidth: '60ch' }}>
        Aparece no rodapé de todas as páginas.
      </p>

      <form action={salvarConfig} className="cartao" style={{ padding: 22, maxWidth: 620 }}>
        {campo('nomeSite', 'Nome do site', c?.nomeSite ?? 'PET EEL')}
        <label className="campo">
          <span>Descrição</span>
          <textarea name="descricao" defaultValue={c?.descricao ?? ''} />
        </label>

        <h2 style={{ fontSize: 18, textTransform: 'uppercase', margin: '22px 0 12px' }}>Contato</h2>
        {campo('endereco', 'Endereço', c?.endereco)}
        {campo('telefone', 'Telefone', c?.telefone)}
        {campo('email', 'E-mail', c?.email)}

        <h2 style={{ fontSize: 18, textTransform: 'uppercase', margin: '22px 0 12px' }}>Redes</h2>
        {campo('instagram', 'Instagram', c?.instagram, undefined, 'url')}
        {campo('linkedin', 'LinkedIn', c?.linkedin, undefined, 'url')}
        {campo('facebook', 'Facebook', c?.facebook, undefined, 'url')}

        <h2 style={{ fontSize: 18, textTransform: 'uppercase', margin: '22px 0 12px' }}>Faixa de aviso</h2>
        <label className="campo" style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <input type="checkbox" name="avisoAtivo" defaultChecked={c?.avisoAtivo ?? false} />
          <span style={{ margin: 0, textTransform: 'none', letterSpacing: 0, font: '400 14px var(--corpo)', color: 'var(--escuro)' }}>
            Mostrar a faixa escura logo abaixo do topo da home
          </span>
        </label>
        {campo('avisoTexto', 'Texto', c?.avisoTexto, 'Ex: Sexta, 12h10 — seminário semanal no CTC')}
        {campo('avisoLink', 'Link', c?.avisoLink, 'Ex: /seminarios')}

        <button type="submit" className="btn" style={{ marginTop: 10 }}>Salvar</button>
      </form>
    </>
  )
}
