'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * useLinkStatus fica pendente enquanto o Next busca a página no
 * servidor. É o que permite marcar a aba no instante do clique, em vez
 * de esperar a navegação terminar.
 */
export function NavPainel({ itens }: { itens: [string, string][] }) {
  const pathname = usePathname()

  return (
    <>
      {itens.map(([href, label]) => (
        <ItemComEstado key={href} href={href} label={label} ativo={href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)} />
      ))}
    </>
  )
}

/** Link + estado de carregamento aplicado no próprio <a>. */
function ItemComEstado({ href, label, ativo }: { href: string; label: string; ativo: boolean }) {
  return (
    <Link href={href} data-ativo={ativo ? '1' : '0'}>
      <Rotulo label={label} />
    </Link>
  )
}

function Rotulo({ label }: { label: string }) {
  const { pending } = useLinkStatus()
  return (
    <span data-carregando={pending ? '1' : '0'} style={{ display: 'inline-flex', alignItems: 'center' }}>
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
