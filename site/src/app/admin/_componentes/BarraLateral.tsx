import Link from 'next/link'
import { NavPainel } from './NavPainel'
import { PainelCasca, BotaoRecolher } from './PainelCasca'
import { Icone, type NomeIcone } from './icones'

export function BarraLateral({
  recolhidoInicial,
  itens,
  nomeUsuario,
  papelRotulo,
  sair,
  children,
}: {
  recolhidoInicial: boolean
  itens: [string, string, NomeIcone][]
  nomeUsuario: string
  papelRotulo: string
  sair: () => Promise<void>
  children: React.ReactNode
}) {
  return (
    <PainelCasca recolhidoInicial={recolhidoInicial}>
      <nav className="painel-nav">
        <div className="painel-logo">
          {/* na barra recolhida só o emblema (o início da imagem) aparece */}
          <span className="logo-caixa">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marca/logo-v2.png" alt="PET EEL" />
          </span>
        </div>

        <NavPainel itens={itens} />

        <div className="painel-rodape">
          <BotaoRecolher />

          <p className="painel-usuario">
            {nomeUsuario}
            <br />
            <span className="papel">{papelRotulo}</span>
          </p>

          <Link href="/" className="rodape-item" aria-label="Ver o site" title="Ver o site">
            <Icone nome="site" />
            <span className="nav-rotulo">Ver o site</span>
          </Link>
          <form action={sair}>
            <button type="submit" className="rodape-item" aria-label="Sair" title="Sair">
              <Icone nome="sair" />
              <span className="nav-rotulo">Sair</span>
            </button>
          </form>
        </div>
      </nav>

      <div className="painel-corpo">{children}</div>
    </PainelCasca>
  )
}
