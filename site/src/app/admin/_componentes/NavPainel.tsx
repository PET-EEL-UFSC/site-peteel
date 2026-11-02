'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { Icone, type NomeIcone } from './icones'

/**
 * useLinkStatus fica pendente enquanto o Next busca a página no
 * servidor. É o que permite marcar a aba no instante do clique, em vez
 * de esperar a navegação terminar.
 */
export function NavPainel({ itens }: { itens: [string, string, NomeIcone][] }) {
  const pathname = usePathname()

  return (
    <>
      {itens.map(([href, label, icone]) => (
        <ItemComEstado key={href} href={href} label={label} icone={icone} ativo={href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)} />
      ))}
    </>
  )
}

/** Link + estado de carregamento aplicado no próprio <a>. */
function ItemComEstado({ href, label, icone, ativo }: { href: string; label: string; icone: NomeIcone; ativo: boolean }) {
  // aria-label/title: com a barra recolhida o texto some, e o link precisa continuar com nome
  return (
    <Link href={href} data-ativo={ativo ? '1' : '0'} aria-label={label} title={label}>
      <Icone nome={icone} />
      <Rotulo label={label} />
    </Link>
  )
}

function Rotulo({ label }: { label: string }) {
  const { pending } = useLinkStatus()
  return (
    <span className="nav-rotulo" data-carregando={pending ? '1' : '0'}>
      {label}
      {pending && (
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 9,
            height: 9,
            marginLeft: 8,
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'gira 0.6s linear infinite',
          }}
        />
      )}
    </span>
  )
}
