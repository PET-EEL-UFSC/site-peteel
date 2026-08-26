/**
 * Aparece na hora em que a aba é clicada e some quando os dados chegam.
 *
 * Sem isso a navegação parece travada: as páginas do painel consultam o
 * banco no servidor, e o Next só pinta a tela nova quando a resposta
 * volta — com a Neon hibernando por inatividade, isso dá segundos de
 * tela imóvel.
 */
export function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <div style={{ height: 34, width: 220, background: 'rgba(44,43,34,0.12)', marginBottom: 22 }} />
      <div style={{ height: 15, width: 420, background: 'rgba(44,43,34,0.08)', marginBottom: 28 }} />

      <div className="cartao" style={{ padding: 0 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 16,
              padding: '15px 16px',
              borderBottom: i === 4 ? 'none' : '1px solid rgba(44,43,34,0.12)',
              // escalona a animação para dar sensação de movimento
              animation: `pulsa 1.1s ease-in-out ${i * 0.09}s infinite`,
            }}
          >
            <div style={{ height: 14, flex: 2, background: 'rgba(44,43,34,0.12)' }} />
            <div style={{ height: 14, flex: 1, background: 'rgba(44,43,34,0.08)' }} />
            <div style={{ height: 14, width: 90, background: 'rgba(44,43,34,0.08)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
