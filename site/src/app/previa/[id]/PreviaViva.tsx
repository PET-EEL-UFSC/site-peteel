'use client'

import { useEffect, useState } from 'react'
import { blocosSchema, type Blocos } from '@/lib/content/blocos'
import { RenderBlocos, type DadosPagina } from '@/components/blocos'
import type { MsgParaPrevia } from '@/lib/content/previa'
import { Header } from '@/components/Header'
import { Footer, type ConfigSite } from '@/components/Footer'
import type { NoArvore } from '@/components/blocos/Mapa'

export function PreviaViva({
  inicial,
  dados,
  arvore,
  config,
}: {
  inicial: Blocos
  dados: DadosPagina
  arvore: NoArvore[]
  config: ConfigSite
}) {
  const [blocos, setBlocos] = useState<Blocos>(inicial)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    function aoReceber(e: MessageEvent) {
      // same-origin obrigatório: sem isso qualquer aba poderia injetar
      // conteúdo aqui dentro
      if (e.origin !== window.location.origin) return
      const msg = e.data as MsgParaPrevia
      if (!msg || typeof msg !== 'object') return

      if (msg.tipo === 'blocos') {
        const r = blocosSchema.safeParse(msg.blocos)
        if (r.success) {
          setBlocos(r.data)
          setErro(null)
        } else {
          // mantém o último estado válido na tela em vez de piscar em
          // branco enquanto a pessoa está no meio de uma edição
          setErro(r.error.issues[0]?.message ?? 'conteúdo inválido')
        }
        return
      }

      if (msg.tipo === 'selecionar') {
        document.getElementById(`bloco-${msg.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    window.addEventListener('message', aoReceber)
    window.parent?.postMessage({ tipo: 'pronta' }, window.location.origin)
    return () => window.removeEventListener('message', aoReceber)
  }, [])

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {erro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99, background: '#2C2B22', color: '#ff9a8a', padding: '8px 16px', font: '400 12px var(--corpo)' }}>
          Conteúdo incompleto: {erro} — mostrando a última versão válida.
        </div>
      )}
      {/* cabeçalho e rodapé de verdade: o topo das páginas é desenhado
          para caber sob o header fixo, então sem ele a prévia mente */}
      <Header arvore={arvore} />
      <main>
        {/* âncoras por bloco, para o editor rolar até o selecionado */}
        {blocos.map((b) => (
          <div key={b.id} id={`bloco-${b.id}`}>
            <RenderBlocos blocos={[b]} dados={dados} />
          </div>
        ))}
        {blocos.length === 0 && (
          <p style={{ padding: 60, textAlign: 'center', font: '400 15px var(--corpo)', color: 'rgba(44,43,34,0.5)' }}>
            Esta página ainda não tem blocos.
          </p>
        )}
      </main>
      <Footer config={config} arvore={arvore} />
    </div>
  )
}
