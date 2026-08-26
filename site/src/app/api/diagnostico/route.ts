import { NextResponse } from 'next/server'

/**
 * TEMPORÁRIO — remover assim que o login estiver de pé.
 *
 * Diz se as variáveis de ambiente chegaram no runtime, sem revelar
 * segredo nenhum: só presença, tamanho e formato. O client_id é público
 * por natureza (vai na URL do OAuth), então o prefixo dele pode aparecer;
 * do secret só sai o comprimento e se o prefixo bate.
 */
export const dynamic = 'force-dynamic'

function checar(nome: string, esperado?: { comeca?: string; termina?: string }) {
  const v = process.env[nome]
  if (v === undefined) return { estado: 'AUSENTE' }
  if (v === '') return { estado: 'VAZIA' }

  const temAspas = v.startsWith('"') || v.startsWith("'")
  const temEspaco = v !== v.trim()
  const r: Record<string, unknown> = { estado: 'ok', tamanho: v.length }
  if (temAspas) r.problema = 'valor começa com aspas — a Vercel guardou as aspas junto'
  if (temEspaco) r.problema = 'valor tem espaço ou quebra de linha nas pontas'
  if (esperado?.comeca) r.prefixoCorreto = v.replace(/^["']/, '').startsWith(esperado.comeca)
  if (esperado?.termina) r.sufixoCorreto = v.replace(/["']$/, '').endsWith(esperado.termina)
  return r
}

export async function GET() {
  return NextResponse.json({
    AUTH_GOOGLE_ID: checar('AUTH_GOOGLE_ID', { termina: '.apps.googleusercontent.com' }),
    AUTH_GOOGLE_SECRET: checar('AUTH_GOOGLE_SECRET', { comeca: 'GOCSPX-' }),
    AUTH_SECRET: checar('AUTH_SECRET'),
    NEXTAUTH_URL: { ...checar('NEXTAUTH_URL'), valor: process.env.NEXTAUTH_URL ?? null },
    DATABASE_URL: checar('DATABASE_URL'),
    STORAGE: { valor: process.env.STORAGE ?? null },
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    VERCEL_URL: process.env.VERCEL_URL ?? null,
  })
}
