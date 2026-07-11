/**
 * Creates the AI_SYSTEM bot user that owns auto-generated alerts.
 * Run once: npx tsx seed-ai-user.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from './src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  // Random password — this account is never used for login
  const passwordHash = await bcrypt.hash(`ai-system-${Date.now()}`, 12)

  const aiUser = await prisma.user.upsert({
    where: { username: 'ai_system' },
    update: {},   // already exists — leave it untouched
    create: {
      username: 'ai_system',
      email: 'ai@srans.internal',
      passwordHash,
      isGovernment: true,
      isVerified: true,
      isSuperuser: false,
      agencyName: 'SRANS AI Engine',
      department: 'Automated Detection',
    },
  })

  console.log(`\n✅  AI system user ready:`)
  console.log(`   ID       : ${aiUser.id}`)
  console.log(`   Username : ${aiUser.username}`)
  console.log(`   Email    : ${aiUser.email}\n`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
