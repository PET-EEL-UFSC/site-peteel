import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { avaliarAcesso, emailSchema, type Papel } from '@/lib/auth/acesso'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'database' },
  pages: { signIn: '/entrar', error: '/entrar' },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    /**
     * Autenticar no Google NÃO é autorização. Como o login é Gmail sem
     * restrição de domínio, qualquer pessoa passa pelo Google — o portão
     * é a tabela User. Só entra quem já foi convidado e está ativo.
     */
    async signIn({ user }) {
      const parsed = emailSchema.safeParse(user.email ?? '')
      if (!parsed.success) return '/entrar?erro=nao-convidado'

      const convidado = await db.user.findUnique({
        where: { email: parsed.data },
        select: { id: true, email: true, papel: true, ativo: true, primeiroAcesso: true },
      })

      const r = avaliarAcesso(convidado)
      if (!r.permitido) return `/entrar?erro=${r.motivo}`

      // Registra o primeiro acesso e sincroniza nome/foto do Google
      await db.user.update({
        where: { id: r.userId },
        data: {
          primeiroAcesso: convidado!.primeiroAcesso ?? new Date(),
          nome: user.name ?? undefined,
          imagem: user.image ?? undefined,
        },
      })
      return true
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.papel = (user as { papel?: Papel }).papel ?? 'EDITOR'
      }
      return session
    },
  },
})
