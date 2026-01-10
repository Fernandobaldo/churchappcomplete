// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

// Força o NODE_ENV para test antes de importar qualquer coisa
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { prisma } from '../../src/lib/prisma'
import { SubscriptionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function seedTestDatabase() {
  console.log('[SEED] Iniciando seed do banco de teste...')

  // Busca ou cria o plano (obrigatório para a assinatura)
  let plan = await prisma.plan.findFirst({
    where: { name: 'Free Plan' },
  })

  if (!plan) {
    try {
      plan = await prisma.plan.create({
    data: {
      name: 'Free Plan',
      price: 0,
      features: ['basic'],
      maxMembers: 10,
      maxBranches: 1,
    },
  })
    } catch (error: any) {
      // Se falhar por constraint, tenta buscar novamente
      if (error.code === 'P2002') {
        plan = await prisma.plan.findFirst({
          where: { name: 'Free Plan' },
        })
      } else {
        throw error
      }
    }
  }

  if (!plan) {
    throw new Error('Não foi possível criar ou encontrar o plano')
  }

  // Busca ou cria um usuário (admin do SaaS)
  let user = await prisma.user.findUnique({
    where: { email: 'user@example.com' },
  })

  if (!user) {
    try {
      user = await prisma.user.create({
    data: {
      firstName: 'Usuário',
      lastName: 'SaaS',
      email: 'user@example.com',
      password: await bcrypt.hash('password123', 10),
    },
  })
    } catch (error: any) {
      // Se falhar por constraint, tenta buscar novamente
      if (error.code === 'P2002') {
        user = await prisma.user.findUnique({
          where: { email: 'user@example.com' },
        })
      } else {
        throw error
      }
    }
  }

  // Busca ou cria uma assinatura vinculada ao usuário
  let subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
  })

  if (!subscription) {
    try {
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: SubscriptionStatus.active,
    },
  })
    } catch (error: any) {
      // Se falhar por constraint, ignora (já existe)
      if (error.code !== 'P2002' && error.code !== 'P2003') {
        throw error
      }
    }
  }

  // Busca ou cria uma igreja
  let church = await prisma.church.findFirst({
    where: { name: 'Igreja Teste' },
  })

  if (!church) {
    church = await prisma.church.create({
    data: {
      name: 'Igreja Teste',
    },
  })
  }

  // Busca ou cria uma filial
  let branch = await prisma.branch.findFirst({
    where: { name: 'Filial Central', churchId: church.id },
  })

  if (!branch) {
    branch = await prisma.branch.create({
    data: {
      name: 'Filial Central',
      churchId: church.id,
    },
  })
  }

  // NOVO MODELO: Cria User para o Member primeiro
  let memberUser = await prisma.user.findUnique({
    where: { email: 'member@example.com' },
  })

  if (!memberUser) {
    try {
      memberUser = await prisma.user.create({
        data: {
          firstName: 'Membro',
          lastName: 'Teste',
          email: 'member@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })
      console.log('[SEED] ✅ User para Member criado:', memberUser.email)
    } catch (error: any) {
      if (error.code === 'P2002') {
        memberUser = await prisma.user.findUnique({
          where: { email: 'member@example.com' },
        })
        console.log('[SEED] ⚠️ User para Member já existia, usando existente:', memberUser?.email)
      } else {
        throw error
      }
    }
  }

  // Busca ou cria um membro associado ao User (SEM senha - usa senha do User)
  let member = await prisma.member.findUnique({
    where: { email: 'member@example.com' },
  })

  if (!member && memberUser) {
    try {
      member = await prisma.member.create({
        data: {
          name: 'Membro Teste',
          email: 'member@example.com',
          role: 'ADMINGERAL',
          branchId: branch.id,
          userId: memberUser.id, // Associa ao User
        },
      })
      console.log('[SEED] ✅ Member criado (sem senha, associado ao User):', member.email)
    } catch (error: any) {
      // Se falhar por constraint, tenta buscar novamente
      if (error.code === 'P2002') {
        member = await prisma.member.findUnique({
          where: { email: 'member@example.com' },
        })
        console.log('[SEED] ⚠️ Member já existia, usando existente:', member?.email)
      } else {
        throw error
      }
    }
  } else {
    console.log('[SEED] ⚠️ Member já existia, usando existente:', member?.email)
  }

  // Verifica se os dados foram realmente salvos
  const verifyUser = await prisma.user.findUnique({ where: { email: user.email } })
  const verifyMember = await prisma.member.findUnique({ where: { email: member.email } })
  
  if (!verifyUser) {
    console.error('[SEED] ❌ ERRO: User não encontrado após criação!')
  }
  if (!verifyMember) {
    console.error('[SEED] ❌ ERRO: Member não encontrado após criação!')
  }
  
  console.log('[SEED] ✅ Seed concluído. User:', user.email, 'Member:', member.email)
  console.log('[SEED] ✅ Verificação: User existe:', !!verifyUser, 'Member existe:', !!verifyMember)
  return { user, member }
}
