import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'

export async function seedTestDatabase() {


  // Cria um plano (obrigatório para a assinatura)
  const plan = await prisma.plan.create({
    data: {
      name: 'Free Plan',
      price: 0,
      features: ['basic'],
      maxMembers: 10,
      maxBranches: 1,
    },
  })

  // Cria um usuário (admin do SaaS)
  const user = await prisma.user.create({
    data: {
      name: 'Usuário SaaS',
      email: 'user@example.com',
      password: await bcrypt.hash('password123', 10),
    },
  })

  // Cria uma assinatura vinculada ao usuário
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: 'active',
    },
  })

  // Cria uma igreja (não tem userId, pois não está no schema)
  const church = await prisma.church.create({
    data: {
      name: 'Igreja Teste',
    },
  })

  // Cria uma filial
  const branch = await prisma.branch.create({
    data: {
      name: 'Filial Central',
      churchId: church.id,
      pastorName: 'Pr. João',
    },
  })

  // Cria um membro com senha
  const member = await prisma.member.create({
    data: {
      name: 'Membro Teste',
      email: 'member@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'ADMINGERAL',
      branchId: branch.id,
    },
  })

  return { user, member }
}
