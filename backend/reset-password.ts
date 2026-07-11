/**
 * Password reset script
 * Usage: npx tsx reset-password.ts <username> <newPassword>
 * Example: npx tsx reset-password.ts govofficial MyNewPass123
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from './src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const [, , username, newPassword] = process.argv

  if (!username || !newPassword) {
    console.error('\n❌  Usage: npx tsx reset-password.ts <username> <newPassword>')
    console.error('    Example: npx tsx reset-password.ts govofficial MyNewPass123\n')
    process.exit(1)
  }

  if (newPassword.length < 8) {
    console.error('\n❌  Password must be at least 8 characters.\n')
    process.exit(1)
  }

  // Check the user exists first
  const existing = await prisma.user.findUnique({ where: { username } })
  if (!existing) {
    console.error(`\n❌  User "${username}" not found in the database.\n`)
    process.exit(1)
  }

  const hashed = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { username },
    data: { passwordHash: hashed },
  })

  console.log(`\n✅  Password reset for "${username}" (${existing.email})`)
  console.log(`    New password: ${newPassword}\n`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
