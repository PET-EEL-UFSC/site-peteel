/**
 * Endereço público do site, sem barra no fim. Vem do NEXTAUTH_URL (que já
 * precisa ser o endereço de produção); o padrão é o domínio oficial.
 */
export const SITE_URL = (process.env.NEXTAUTH_URL?.trim() || 'https://www.peteel.com.br').replace(/\/+$/, '')

/** Áreas que não devem aparecer em buscadores. */
export const CAMINHOS_RESTRITOS = ['/admin', '/aluno', '/api', '/entrar', '/previa', '/apresentacao']
