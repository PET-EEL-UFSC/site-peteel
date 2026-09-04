'use client'

import { PALETA, ehGradiente, hexDe, type Cor, type CorSolida, type NomeCor } from '@/lib/content/cores'

export function Texto({ rotulo, valor, onChange, dica, placeholder }: { rotulo: string; valor: string; onChange: (v: string) => void; dica?: string; placeholder?: string }) {
  return (
    <label className="campo">
      <span>{rotulo}</span>
      <input type="text" value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {dica && <p className="dica">{dica}</p>}
    </label>
  )
}

export function Area({ rotulo, valor, onChange, dica }: { rotulo: string; valor: string; onChange: (v: string) => void; dica?: string }) {
  return (
    <label className="campo">
      <span>{rotulo}</span>
      <textarea value={valor} onChange={(e) => onChange(e.target.value)} />
      {dica && <p className="dica">{dica}</p>}
    </label>
  )
}

export function Selecao<T extends string | number>({ rotulo, valor, opcoes, onChange, dica }: { rotulo: string; valor: T; opcoes: [T, string][]; onChange: (v: T) => void; dica?: string }) {
  return (
    <label className="campo">
      <span>{rotulo}</span>
      <select
        value={String(valor)}
        onChange={(e) => {
          const bruto = e.target.value
          const achado = opcoes.find(([v]) => String(v) === bruto)
          if (achado) onChange(achado[0])
        }}
      >
        {opcoes.map(([v, l]) => (
          <option key={String(v)} value={String(v)}>{l}</option>
        ))}
      </select>
      {dica && <p className="dica">{dica}</p>}
    </label>
  )
}

export function Alternador({ rotulo, valor, onChange, dica }: { rotulo: string; valor: boolean; onChange: (v: boolean) => void; dica?: string }) {
  return (
    <label className="campo" style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
      <span style={{ margin: 0, textTransform: 'none', letterSpacing: 0, font: '400 14px var(--corpo)', color: 'var(--escuro)' }}>
        {rotulo}
        {dica && <p className="dica" style={{ marginTop: 2 }}>{dica}</p>}
      </span>
    </label>
  )
}

/** Fileira de swatches restrita a cor sólida — usada sozinha ou dentro do modo gradiente. */
function SwatchesSolidas({ valor, onChange }: { valor: CorSolida; onChange: (v: CorSolida) => void }) {
  const nomes = Object.keys(PALETA) as NomeCor[]
  const ehDaPaleta = nomes.includes(valor as NomeCor)
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      {nomes.map((n) => (
        <button
          key={n}
          type="button"
          title={n}
          onClick={() => onChange(n)}
          style={{ width: 28, height: 28, background: PALETA[n], border: valor === n ? '3px solid var(--azul)' : '2px solid var(--escuro)', cursor: 'pointer' }}
        />
      ))}
      <input
        type="color"
        value={ehDaPaleta ? '#ffffff' : valor}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        title="Cor personalizada"
        style={{ width: 32, height: 28, border: !ehDaPaleta ? '3px solid var(--azul)' : '2px solid var(--escuro)', background: '#fff', padding: 2, cursor: 'pointer' }}
      />
    </div>
  )
}

/**
 * Paleta fechada por padrão. Hex livre e gradiente ficam atrás de um
 * clique a mais — é o que mantém a identidade de pé entre as gestões.
 */
export function EscolhaCor({ rotulo, valor, onChange, permitirNenhuma }: { rotulo: string; valor: Cor | undefined; onChange: (v: Cor | undefined) => void; permitirNenhuma?: boolean }) {
  const nomes = Object.keys(PALETA) as NomeCor[]
  const gradiente = valor !== undefined && ehGradiente(valor)

  if (gradiente) {
    const g = valor
    return (
      <div className="campo">
        <span>{rotulo}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <SwatchesSolidas valor={g.de} onChange={(de) => onChange({ ...g, de })} />
          <span aria-hidden style={{ font: '900 13px var(--condensada)' }}>→</span>
          <SwatchesSolidas valor={g.para} onChange={(para) => onChange({ ...g, para })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, font: '400 12.5px var(--corpo)' }}>
            Ângulo
            <input
              type="number"
              min={0}
              max={360}
              value={g.angulo}
              onChange={(e) => onChange({ ...g, angulo: Number(e.target.value) })}
              style={{ width: 56 }}
            />
          </label>
          <button
            type="button"
            onClick={() => onChange(g.de)}
            style={{ font: '700 11px var(--condensada)', letterSpacing: '0.06em', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            voltar pra cor sólida
          </button>
        </div>
        <div
          aria-hidden
          style={{ marginTop: 8, height: 22, width: 140, background: `linear-gradient(${g.angulo}deg, ${hexDe(g.de)}, ${hexDe(g.para)})`, border: '2px solid var(--escuro)' }}
        />
      </div>
    )
  }

  const ehDaPaleta = valor === undefined || nomes.includes(valor as NomeCor)

  return (
    <div className="campo">
      <span>{rotulo}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {permitirNenhuma && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            title="Automático"
            style={{ width: 30, height: 30, border: valor === undefined ? '3px solid var(--azul)' : '2px solid var(--escuro)', background: '#fff', cursor: 'pointer', font: '900 10px var(--condensada)' }}
          >
            AUT
          </button>
        )}
        {nomes.map((n) => (
          <button
            key={n}
            type="button"
            title={n}
            onClick={() => onChange(n)}
            style={{ width: 30, height: 30, background: PALETA[n], border: valor === n ? '3px solid var(--azul)' : '2px solid var(--escuro)', cursor: 'pointer' }}
          />
        ))}
        <input
          type="color"
          value={ehDaPaleta ? '#ffffff' : (valor as string)}
          onChange={(e) => onChange(e.target.value.toUpperCase() as Cor)}
          title="Cor personalizada"
          style={{ width: 34, height: 30, border: !ehDaPaleta ? '3px solid var(--azul)' : '2px solid var(--escuro)', background: '#fff', padding: 2, cursor: 'pointer' }}
        />
        <button
          type="button"
          title="Gradiente"
          onClick={() => onChange({ tipo: 'gradiente', de: ehDaPaleta && valor !== undefined ? (valor as NomeCor) : 'azul', para: 'laranja', angulo: 135 })}
          style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--azul), var(--laranja))', border: '2px solid var(--escuro)', cursor: 'pointer' }}
        />
      </div>
      {!ehDaPaleta && <p className="dica">Cor fora da paleta da marca ({valor}).</p>}
    </div>
  )
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ border: '2px solid rgba(44,43,34,0.2)', padding: '14px 16px 4px', marginBottom: 16 }}>
      <legend style={{ font: '900 11px var(--condensada)', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0 6px' }}>{titulo}</legend>
      {children}
    </fieldset>
  )
}
