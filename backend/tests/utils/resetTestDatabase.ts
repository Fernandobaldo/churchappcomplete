import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

import { prisma } from '../../src/lib/prisma'

// Ordem correta para deletar registros respeitando dependências de foreign keys
export async function resetTestDatabase() {
 await prisma.devotionalLike.deleteMany()
  await prisma.devotional.deleteMany()
  await prisma.notice.deleteMany()
  await prisma.event.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.contribution.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.member.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.church.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.user.deleteMany()
  await prisma.plan.deleteMany()
}
