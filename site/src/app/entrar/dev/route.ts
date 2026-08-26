import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { adminInicial } from '@/lib/auth/acesso'

/**
 * Atalho de desenvolvimento: cria uma sessão para o ADMIN_INICIAL sem
 * passar pelo Google, para dar para ver o painel antes de as credenciais
 * de OAuth existirem.
 *
 * É um bypass de autenticação — por isso tem duas travas independentes:
 * nunca roda em produção, e só roda se PERMITIR_LOGIN_DEV=1 estiver no
 * ambiente. PERMITIR_LOGIN_DEV não está no .env.example de propósito;
 * quando o login do Google estiver configurado, apague esta pasta.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production' || process.env.PERMITIR_LOGIN_DEV !== '1') {
    return new NextResponse('Não encontrado', { status: 404 })
  }

  const email = adminInicial()
  if (!email) return new NextResponse('Defina ADMIN_INICIAL no .env', { status: 400 })

  const u = await db.user.findUnique({ where: { email }, select: { id: true, ativo: true } })
  if (!u) return new NextResponse(`Nenhum usuário com ${email}. Rode: npm run db:seed`, { status: 400 })
  if (!u.ativo) return new NextResponse('Esse acesso está desativado.', { status: 403 })

  const token = randomUUID()
  await db.session.create({
    data: { sessionToken: token, userId: u.id, expires: new Date(Date.now() + 7 * 864e5) },
  })

  const r = NextResponse.redirect(new URL('/admin', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'))
  r.cookies.set('authjs.session-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
  return r
}
