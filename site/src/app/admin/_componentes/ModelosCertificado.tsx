'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarModeloCertificado, apagarModeloCertificado, previaModeloCertificado } from '../acoes-certificados'
import { CAIXAS_PADRAO, CAMPOS, proporcaoDoFundoOk, type Caixa } from '@/lib/certificado-modelo'

type Midia = { id: string; url: string; alt: string; largura: number; altura: number }
type Modelo = { id: string; nome: string; fundoMidiaId: string | null; caixas: Caixa[]; usos: number }
type Msg = { ok: boolean; texto: string } | null

const CAIXA_NOVA: Caixa = {
  texto: 'Texto novo',
  x: 10,
  y: 70,
  largura: 80,
  tamanho: 16,
  cor: '#2C2B22',
  fonte: 'sans',
  negrito: false,
  alinhamento: 'centro',
  encolher: false,
}

function numero(v: string, padrao: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : padrao
}

function EditorModelo({ inicial, midias, aoMudar }: { inicial: Modelo | null; midias: Midia[]; aoMudar: () => void }) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [fundoId, setFundoId] = useState(inicial?.fundoMidiaId ?? '')
  const [caixas, setCaixas] = useState<Caixa[]>(inicial?.caixas ?? CAIXAS_PADRAO)
  const [msg, setMsg] = useState<Msg>(null)
  const [previaUrl, setPreviaUrl] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const urlAnterior = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (urlAnterior.current) URL.revokeObjectURL(urlAnterior.current)
    },
    []
  )

  const fundo = midias.find((m) => m.id === fundoId)
  const altera = (i: number, parte: Partial<Caixa>) => setCaixas((c) => c.map((x, k) => (k === i ? { ...x, ...parte } : x)))

  const previsualizar = () =>
    iniciar(async () => {
      const r = await previaModeloCertificado({ fundoMidiaId: fundoId || null, caixas })
      if (!r.ok) return setMsg({ ok: false, texto: r.erro })
      const bytes = Uint8Array.from(atob(r.pdfBase64), (c) => c.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      if (urlAnterior.current) URL.revokeObjectURL(urlAnterior.current)
      urlAnterior.current = url
      setPreviaUrl(url)
      setMsg(null)
    })

  const salvar = () =>
    iniciar(async () => {
      const r = await salvarModeloCertificado({ id: inicial?.id ?? null, nome, fundoMidiaId: fundoId || null, caixas })
      setMsg({ ok: r.ok, texto: r.ok ? r.mensagem : r.erro })
      if (r.ok) aoMudar()
    })

  return (
    <div>
      {msg && <p className={msg.ok ? 'aviso-ok' : 'aviso-erro'}>{msg.texto}</p>}

      <label className="campo" style={{ maxWidth: 420 }}>
        <span>Nome do modelo</span>
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder="Ex: Certificado minicursos 2026" />
      </label>

      <label className="campo" style={{ maxWidth: 520 }}>
        <span>Imagem de fundo (PNG ou JPG, A4 paisagem)</span>
        <select value={fundoId} onChange={(e) => setFundoId(e.target.value)}>
          <option value="">Sem imagem (fundo branco)</option>
          {midias.map((m) => (
            <option key={m.id} value={m.id}>{m.alt} ({m.largura}×{m.altura})</option>
          ))}
        </select>
        <p className="dica">
          Envie a arte em <strong>Imagens</strong> antes. Tamanho bom: 1754×1240 px (A4 paisagem). Imagem com outra proporção sai esticada.
        </p>
      </label>
      {fundo && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fundo.url} alt="" style={{ height: 70, border: '2px solid var(--escuro)' }} />
          {!proporcaoDoFundoOk(fundo.largura, fundo.altura) && (
            <p className="aviso-erro" style={{ margin: 0 }}>Essa imagem não tem proporção de A4 paisagem (≈ 1,41:1); o certificado vai sair distorcido.</p>
          )}
        </div>
      )}

      <h3 style={{ fontSize: 15, textTransform: 'uppercase', margin: '18px 0 6px' }}>Caixas de texto</h3>
      <p className="dica" style={{ marginBottom: 10 }}>
        Posição e largura em % da página (0 a 100; o topo é 0). Campos que o site preenche:{' '}
        {CAMPOS.map(([c, d]) => (
          <span key={c}><code>{c}</code> ({d}); </span>
        ))}
        Um trecho entre <code>[[ ]]</code> some se algum campo dentro dele estiver vazio, ex.: <code>[[, com carga horária de {'{carga}'}]]</code>.
      </p>

      {caixas.map((c, i) => (
        <div key={i} style={{ border: '1px solid rgba(44,43,34,0.25)', background: '#fbfbf8', padding: '12px 12px 4px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ font: '900 12px var(--condensada)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Caixa {i + 1}</strong>
            <button type="button" className="mini" title="Remover caixa" onClick={() => setCaixas((a) => a.filter((_, k) => k !== i))}>×</button>
          </div>
          <label className="campo">
            <span>Texto</span>
            <textarea value={c.texto} onChange={(e) => altera(i, { texto: e.target.value })} rows={2} maxLength={600} />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {(
              [
                ['x', 'Esquerda %'],
                ['y', 'Topo %'],
                ['largura', 'Largura %'],
                ['tamanho', 'Letra (pt)'],
              ] as const
            ).map(([campo, rotulo]) => (
              <label key={campo} className="campo" style={{ margin: 0 }}>
                <span>{rotulo}</span>
                <input type="number" step={0.5} value={c[campo]} onChange={(e) => altera(i, { [campo]: numero(e.target.value, c[campo]) })} style={{ width: 90 }} />
              </label>
            ))}
            <label className="campo" style={{ margin: 0 }}>
              <span>Cor</span>
              <input type="color" value={c.cor} onChange={(e) => altera(i, { cor: e.target.value })} style={{ width: 60, height: 38, padding: 0 }} />
            </label>
            <label className="campo" style={{ margin: 0 }}>
              <span>Fonte</span>
              <select value={c.fonte} onChange={(e) => altera(i, { fonte: e.target.value as Caixa['fonte'] })}>
                <option value="sans">Sem serifa</option>
                <option value="serif">Com serifa</option>
              </select>
            </label>
            <label className="campo" style={{ margin: 0 }}>
              <span>Alinhamento</span>
              <select value={c.alinhamento} onChange={(e) => altera(i, { alinhamento: e.target.value as Caixa['alinhamento'] })}>
                <option value="esquerda">Esquerda</option>
                <option value="centro">Centro</option>
                <option value="direita">Direita</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 18, margin: '6px 0 10px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', font: '400 14px var(--corpo)' }}>
              <input type="checkbox" checked={c.negrito} onChange={(e) => altera(i, { negrito: e.target.checked })} /> Negrito
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', font: '400 14px var(--corpo)' }}>
              <input type="checkbox" checked={c.encolher} onChange={(e) => altera(i, { encolher: e.target.checked })} /> Uma linha só (a letra diminui até caber, bom pro nome)
            </label>
          </div>
        </div>
      ))}
      {caixas.length < 12 && (
        <button type="button" className="btn btn-claro" style={{ marginBottom: 14 }} onClick={() => setCaixas((a) => [...a, { ...CAIXA_NOVA }])}>
          + Adicionar caixa
        </button>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '6px 0 16px' }}>
        <button type="button" className="btn btn-claro" disabled={pendente} onClick={previsualizar}>
          {pendente ? 'Aguarde…' : 'Pré-visualizar PDF'}
        </button>
        <button type="button" className="btn" disabled={pendente} onClick={salvar}>Salvar modelo</button>
        {inicial && (
          <button
            type="button"
            className="btn btn-perigo"
            style={{ marginLeft: 'auto' }}
            disabled={pendente}
            onClick={() => {
              if (!confirm(`Apagar o modelo "${inicial.nome}"?`)) return
              iniciar(async () => {
                const r = await apagarModeloCertificado(inicial.id)
                setMsg({ ok: r.ok, texto: r.ok ? r.mensagem : r.erro })
                if (r.ok) aoMudar()
              })
            }}
          >
            Apagar modelo
          </button>
        )}
      </div>
      {inicial && inicial.usos > 0 && <p className="dica">Usado por {inicial.usos} minicurso(s): salvar muda o certificado deles.</p>}

      {previaUrl && (
        <iframe
          src={previaUrl}
          title="Pré-visualização do certificado"
          style={{ width: '100%', aspectRatio: '841.89 / 595.28', border: '2px solid var(--escuro)', background: '#fff' }}
        />
      )}
      {previaUrl && <p className="dica">Pré-visualização com dados de exemplo (Maria da Silva Santos). Salve pra aplicar.</p>}
    </div>
  )
}

export function ModelosCertificado({ modelos, midias }: { modelos: Modelo[]; midias: Midia[] }) {
  const router = useRouter()
  const aoMudar = () => router.refresh()

  return (
    <>
      <details className="cartao" style={{ padding: '4px 18px 18px', marginBottom: 14 }} open={modelos.length === 0}>
        <summary style={{ padding: '10px 0', cursor: 'pointer', font: '900 14px var(--condensada)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          + Novo modelo
        </summary>
        <EditorModelo inicial={null} midias={midias} aoMudar={aoMudar} />
      </details>

      {modelos.map((m) => (
        <details key={m.id} className="cartao" style={{ padding: '4px 18px 18px', marginBottom: 14 }}>
          <summary style={{ padding: '10px 0', cursor: 'pointer', font: '900 14px var(--condensada)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {m.nome}
            <span style={{ marginLeft: 10, font: '400 13px var(--corpo)', textTransform: 'none', letterSpacing: 0, color: 'rgba(44,43,34,0.65)' }}>
              usado por {m.usos} minicurso(s)
            </span>
          </summary>
          <EditorModelo inicial={m} midias={midias} aoMudar={aoMudar} />
        </details>
      ))}
    </>
  )
}
