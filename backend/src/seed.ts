/**
 * Quick seed script — run once to set up superuser and verify gov user.
 * Usage: npx tsx src/seed.ts
 */
import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  // Promote user with username "superadmin" to superuser
  const superadmin = await prisma.user.update({
    where: { username: 'superadmin' },
    data: { isSuperuser: true },
  })
  console.log(`✔ Superuser set: ${superadmin.username} (id: ${superadmin.id})`)

  // Verify gov user with username "govofficial"
  const govUser = await prisma.user.update({
    where: { username: 'govofficial' },
    data: { isVerified: true },
  })
  console.log(`✔ Gov user verified: ${govUser.username} (id: ${govUser.id})`)
}

main()
  .then(() => { console.log('Seed complete.'); process.exit(0) })
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
