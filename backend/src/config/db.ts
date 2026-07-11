import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Create the pg adapter pointing at Neon
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

// Singleton — avoids multiple connections during hot reload in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter } as any)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
