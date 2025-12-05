// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

// Força o NODE_ENV para test antes de importar qualquer coisa
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { SubscriptionStatus } from '@prisma/client'
import { registerUserService } from '../../src/services/auth/registerService'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import bcrypt from 'bcryptjs'

describe('RegisterService - Novo Modelo User + Member', () => {
  let adminUser: any
  let adminMember: any
  let branchId: string
  let plan: any

  beforeAll(async () => {
    await resetTestDatabase()

    // Criar plano
    plan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: 'Free Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 10,
          maxBranches: 1,
        },
      })
    }

    // Criar User admin
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin Teste',
        email: 'admin@test.com',
        password: await bcrypt.hash('password123', 10),
        Subscription: {
          create: {
            planId: plan.id,
            status: SubscriptionStatus.active,
          },
        },
      },
    })

    // Criar igreja e branch
    const church = await prisma.church.create({
      data: { name: 'Igreja Teste' },
    })

    const branch = await prisma.branch.create({
      data: {
        name: 'Sede',
        churchId: church.id,
        isMainBranch: true,
      },
    })

    branchId = branch.id

    // Criar Member associado ao User admin
    adminMember = await prisma.member.create({
      data: {
        name: 'Admin Teste',
        email: 'admin@test.com',
        role: 'ADMINGERAL',
        branchId: branch.id,
        userId: adminUser.id,
      },
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
  })

  describe('Registro via Link de Convite', () => {
    let inviteLink: any

    beforeEach(async () => {
      // Criar link de convite para os testes
      inviteLink = await prisma.memberInviteLink.create({
        data: {
          token: `inv_test_${Date.now()}`,
          branchId,
          createdBy: adminUser.id,
          maxUses: 10,
          currentUses: 0,
          isActive: true,
        },
      })
    })

    it('deve criar membro via link de convite com sucesso', async () => {
      const newEmail = `invitemember-${Date.now()}@test.com`

      const result = await registerUserService({
        name: 'Membro via Link',
        email: newEmail,
        password: 'senha123456',
        inviteToken: inviteLink.token,
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.email).toBe(newEmail)
      expect(result.role).toBe('MEMBER')
      expect(result.branchId).toBe(branchId)
      expect(result.inviteLinkId).toBe(inviteLink.id)

      // Verificar que o uso do link foi incrementado
      const updatedLink = await prisma.memberInviteLink.findUnique({
        where: { id: inviteLink.id },
      })
      expect(updatedLink?.currentUses).toBe(1)
    })

    it('deve lançar erro se link não for encontrado', async () => {
      await expect(
        registerUserService({
          name: 'Membro Teste',
          email: 'test@test.com',
          password: 'senha123456',
          inviteToken: 'invalid_token',
        })
      ).rejects.toThrow('Link de convite não encontrado')
    })

    it('deve lançar erro se link estiver desativado', async () => {
      await prisma.memberInviteLink.update({
        where: { id: inviteLink.id },
        data: { isActive: false },
      })

      await expect(
        registerUserService({
          name: 'Membro Teste',
          email: 'test@test.com',
          password: 'senha123456',
          inviteToken: inviteLink.token,
        })
      ).rejects.toThrow('Este link de convite foi desativado')
    })

    it('deve lançar erro se link expirou', async () => {
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 1)

      await prisma.memberInviteLink.update({
        where: { id: inviteLink.id },
        data: { expiresAt: expiredDate },
      })

      await expect(
        registerUserService({
          name: 'Membro Teste',
          email: 'test@test.com',
          password: 'senha123456',
          inviteToken: inviteLink.token,
        })
      ).rejects.toThrow('Este link de convite expirou')
    })

    it('deve lançar erro se limite de usos foi atingido', async () => {
      await prisma.memberInviteLink.update({
        where: { id: inviteLink.id },
        data: { currentUses: 10 },
      })

      await expect(
        registerUserService({
          name: 'Membro Teste',
          email: 'test@test.com',
          password: 'senha123456',
          inviteToken: inviteLink.token,
        })
      ).rejects.toThrow('Este link de convite atingiu o limite de usos')
    })
  })

  describe('Criação de Member Interno', () => {
    it('deve criar User primeiro, depois Member associado (sem senha no Member)', async () => {
      const newEmail = `newmember-${Date.now()}@test.com`
      
      const result = await registerUserService({
        name: 'Novo Membro',
        email: newEmail,
        password: 'senha123456',
        branchId,
        role: 'MEMBER',
        fromLandingPage: false,
        creatorUserId: adminUser.id,
      })

      // Verifica que o Member foi criado
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.email).toBe(newEmail)
      expect(result.role).toBe('MEMBER')
      expect(result.branchId).toBe(branchId)

      // Verifica que o User foi criado
      const createdUser = await prisma.user.findUnique({
        where: { email: newEmail },
      })
      expect(createdUser).toBeDefined()
      expect(createdUser?.email).toBe(newEmail)
      expect(createdUser?.password).toBeDefined() // User tem senha

      // Verifica que o Member está associado ao User
      const createdMember = await prisma.member.findUnique({
        where: { email: newEmail },
        include: { User: true },
      })
      expect(createdMember).toBeDefined()
      expect(createdMember?.userId).toBe(createdUser?.id)
      expect(createdMember?.User).toBeDefined()
      expect(createdMember?.User?.email).toBe(newEmail)

      // NOVO MODELO: Member não deve ter campo password (foi removido do schema)
      // Se tentarmos acessar, deve dar erro de TypeScript, mas verificamos que não existe no banco
      const memberInDb = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Member' AND column_name = 'password'
      `
      expect(Array.isArray(memberInDb)).toBe(true)
      expect((memberInDb as any[]).length).toBe(0) // Coluna password não existe mais
    })

    it('deve fazer login com o User criado (não com o Member)', async () => {
      const newEmail = `loginmember-${Date.now()}@test.com`
      
      // Cria Member via RegisterService
      await registerUserService({
        name: 'Membro Login',
        email: newEmail,
        password: 'senha123456',
        branchId,
        role: 'MEMBER',
        fromLandingPage: false,
        creatorUserId: adminUser.id,
      })

      // Verifica que pode fazer login com email do User (que é o mesmo do Member)
      const user = await prisma.user.findUnique({
        where: { email: newEmail },
      })
      
      expect(user).toBeDefined()
      const passwordMatch = await bcrypt.compare('senha123456', user!.password)
      expect(passwordMatch).toBe(true)
    })

    it('deve retornar erro se email já existe como User', async () => {
      const existingEmail = `existing-${Date.now()}@test.com`
      
      // Cria User primeiro
      await prisma.user.create({
        data: {
          name: 'User Existente',
          email: existingEmail,
          password: await bcrypt.hash('senha123', 10),
        },
      })

      // Tenta criar Member com mesmo email
      await expect(
        registerUserService({
          name: 'Novo Membro',
          email: existingEmail,
          password: 'senha123456',
          branchId,
          role: 'MEMBER',
          fromLandingPage: false,
          creatorUserId: adminUser.id,
        })
      ).rejects.toThrow('Email já cadastrado como usuário.')
    })
  })

  describe('Criação de User via Landing Page', () => {
    it('deve criar apenas User (sem Member) quando fromLandingPage é true', async () => {
      const newEmail = `landing-${Date.now()}@test.com`
      
      const result = await registerUserService({
        name: 'User Landing',
        email: newEmail,
        password: 'senha123456',
        fromLandingPage: true,
      })

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('user')
      expect((result as any).user.email).toBe(newEmail)

      // Verifica que User foi criado
      const user = await prisma.user.findUnique({
        where: { email: newEmail },
      })
      expect(user).toBeDefined()

      // Verifica que Member NÃO foi criado
      const member = await prisma.member.findUnique({
        where: { email: newEmail },
      })
      expect(member).toBeNull()
    })
  })
})


