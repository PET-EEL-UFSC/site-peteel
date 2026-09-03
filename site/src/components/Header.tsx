'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NoArvore } from '@/components/blocos/Mapa'

const cond = 'var(--condensada)'

export function Header({ arvore }: { arvore: NoArvore[] }) {
  const [aberto, setAberto] = useState(false)
  const pathname = usePathname()

  const ativo = (slug: string) =>
    slug === '/' ? pathname === '/' : pathname === slug || pathname.startsWith(slug + '/')

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, background: 'var(--escuro)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'stretch', gap: 30, height: 62 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca/logo.svg" alt="PET EEL" style={{ height: 26, width: 'auto', display: 'block' }} />
        </Link>

        <nav id="main-nav" style={{ display: 'flex', gap: 22, marginLeft: 'auto', alignItems: 'stretch' }}>
          {arvore.map((n) => (
            <div key={n.slug} className="navitem">
              <Link
                href={n.slug}
                style={{
                  font: `700 12.5px/1 ${cond}`,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: ativo(n.slug) ? 'var(--amarelo)' : 'rgba(249,249,249,0.72)',
                }}
              >
                {n.titulo}
              </Link>
              {n.filhos.length > 0 && (
                <div className="navmenu">
                  {n.filhos.map((f) => (
                    <Link key={f.slug} href={f.slug}>
                      {f.titulo}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <Link
          id="nav-cta"
          href="/mapa"
          style={{ display: 'flex', alignItems: 'center', background: 'var(--amarelo)', color: 'var(--escuro)', padding: '0 18px', font: `900 12.5px/1 ${cond}`, letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Mapa do site
        </Link>

        <button
          id="nav-menu"
          type="button"
          aria-label="Menu"
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
          style={{ display: 'none', marginLeft: 'auto', placeItems: 'center', alignSelf: 'center', width: 40, height: 36, background: 'var(--amarelo)', border: 'none', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C2B22" strokeWidth="2" aria-hidden>
            <path d="M4 8h16M4 12h16M4 16h16" />
          </svg>
        </button>
      </div>

      {aberto && (
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--escuro)', padding: '6px 22px 18px', maxHeight: '70vh', overflow: 'auto' }}>
          {arvore.map((n) => (
            <Link
              key={n.slug}
              href={n.slug}
              onClick={() => setAberto(false)}
              style={{ font: `700 15px ${cond}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--offwhite)', padding: '11px 0', borderBottom: '1px solid rgba(249,249,249,0.12)' }}
            >
              {n.titulo}
            </Link>
          ))}
          <Link
            href="/mapa"
            onClick={() => setAberto(false)}
            style={{ font: `900 15px ${cond}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amarelo)', padding: '11px 0' }}
          >
            Mapa do site
          </Link>
        </div>
      )}
    </header>
  )
}
