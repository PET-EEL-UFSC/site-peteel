import type { DefaultSession } from 'next-auth'
import type { Papel } from '@/lib/auth/acesso'

declare module 'next-auth' {
  interface Session {
    user: { id: string; papel: Papel } & DefaultSession['user']
  }
}
