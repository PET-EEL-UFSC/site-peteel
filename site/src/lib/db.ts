import { PrismaClient } from '@prisma/client'

// Em dev o hot reload recria o módulo a cada alteração; sem o cache no
// globalThis cada reload abre um novo pool e o Postgres esgota conexões.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
