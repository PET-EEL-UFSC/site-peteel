import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { decidirEntrada, emailSchema, type Papel } from '@/lib/auth/acesso'

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
     * são as nossas tabelas: User (painel) e Aluno (área do aluno). Só
     * entra quem já foi cadastrado e está ativo.
     */
    async signIn({ user, account, profile }) {
      // A vinculação por e-mail (allowDangerousEmailAccountLinking) só é
      // segura se o Google garante que a pessoa é dona do endereço.
      if (account?.provider === 'google' && profile?.email_verified !== true) {
        return '/entrar?erro=email-nao-verificado'
      }

      const parsed = emailSchema.safeParse(user.email ?? '')
      if (!parsed.success) return '/entrar?erro=nao-convidado'
      const email = parsed.data

      const [convidado, aluno] = await Promise.all([
        db.user.findUnique({
          where: { email },
          select: { id: true, email: true, papel: true, ativo: true, primeiroAcesso: true },
        }),
        db.aluno.findUnique({ where: { email }, select: { ativo: true, nome: true } }),
      ])

      const r = decidirEntrada(convidado, aluno)
      if (!r.permitido) return `/entrar?erro=${r.motivo}`

      if (convidado) {
        // Registra o primeiro acesso e sincroniza nome/foto do Google
        await db.user.update({
          where: { id: convidado.id },
          data: {
            primeiroAcesso: convidado.primeiroAcesso ?? new Date(),
            nome: user.name ?? undefined,
            imagem: user.image ?? undefined,
          },
        })
      } else {
        // Primeiro login de aluno: cria a conta já com o papel mais baixo.
        // upsert com update vazio: se outra requisição criou no meio do
        // caminho, nunca mexe no papel de uma conta que já exista.
        await db.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            papel: 'ALUNO',
            ativo: true,
            nome: aluno?.nome ?? user.name ?? null,
            imagem: user.image ?? null,
            primeiroAcesso: new Date(),
          },
        })
      }
      return true
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // sem papel conhecido, o de menor privilégio
        session.user.papel = (user as { papel?: Papel }).papel ?? 'ALUNO'
      }
      return session
    },
  },
})
