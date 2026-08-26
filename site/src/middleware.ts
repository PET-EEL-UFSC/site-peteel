import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Só checa presença de sessão — o papel é verificado no server component
 * de /admin, que tem acesso ao banco. Middleware roda no edge e não deve
 * abrir conexão com o Postgres.
 */
export function middleware(req: NextRequest) {
  const token =
    req.cookies.get('authjs.session-token') ?? req.cookies.get('__Secure-authjs.session-token')

  if (!token) {
    const url = new URL('/entrar', req.url)
    url.searchParams.set('de', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/previa/:path*'] }
