// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { authenticate } from '../../src/middlewares/authenticate'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'

describe('Registro via Link de Convite - E2E', () => {
  const app = Fastify()
  let inviteLink: any
  let branchId: string
  let churchId: string

  beforeAll(async () => {
    app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'churchapp-secret-key',
    })

    app.decorate('authenticate', authenticate)
    await registerRoutes(app)
    await app.ready()

    await resetTestDatabase()

    // Criar plano ANTES de criar o User para garantir que existe
    let plan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: 'Free Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 5, // Limite baixo para testar
          maxBranches: 1,
        },
      })
    } else {
      // Atualizar o plano se já existir
      plan = await prisma.plan.update({
        where: { id: plan.id },
        data: {
          maxMembers: 5,
        },
      })
    }

    // Criar User admin
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.com',
        password: await bcrypt.hash('password123', 10),
        Subscription: {
          create: {
            planId: plan.id,
            status: 'active',
          },
        },
      },
    })

    // Criar Church e Branch
    const church = await prisma.church.create({
      data: {
        name: 'Igreja Teste',
        isActive: true,
      },
    })

    churchId = church.id

    const branch = await prisma.branch.create({
      data: {
        name: 'Sede',
        churchId: church.id,
        isMainBranch: true,
      },
    })

    branchId = branch.id

    // Criar Member admin
    await prisma.member.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.com',
        role: 'ADMINGERAL',
        branchId: branch.id,
        userId: adminUser.id,
      },
    })
  })

  beforeEach(async () => {
    // Limpar links anteriores e membros de teste
    await prisma.memberInviteLink.deleteMany({})
    await prisma.member.deleteMany({
      where: {
        email: {
          startsWith: 'member',
        },
      },
    })
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'member',
        },
      },
    })

    // Buscar admin user
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@test.com' } })
    if (!adminUser) {
      throw new Error('Admin user não encontrado')
    }

    // Criar link de convite para cada teste
    inviteLink = await prisma.memberInviteLink.create({
      data: {
        token: `inv_test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        branchId,
        createdBy: adminUser.id,
        maxUses: 10,
        currentUses: 0,
        isActive: true,
        expiresAt: null,
      },
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  it('deve registrar membro via link de convite com sucesso', async () => {
    const newEmail = `newmember-${Date.now()}@test.com`

    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Novo Membro',
        email: newEmail,
        password: 'senha123456',
        inviteToken: inviteLink.token,
        phone: '(11) 99999-9999',
      },
    })

    expect(response.statusCode).toBe(201)
    const data = JSON.parse(response.body)
    expect(data.member).toBeDefined()
    expect(data.member.email).toBe(newEmail)
    expect(data.member.role).toBe('MEMBER')
    expect(data.member.branchId).toBe(branchId)
    expect(data.member.inviteLinkId).toBe(inviteLink.id)
    expect(data.token).toBeDefined()

    // Verificar que o uso do link foi incrementado
    const updatedLink = await prisma.memberInviteLink.findUnique({
      where: { id: inviteLink.id },
    })
    expect(updatedLink?.currentUses).toBe(1)
  })

  it('deve retornar 403 com LIMIT_REACHED quando limite de membros for atingido', async () => {
    // O plano tem limite de 5 membros
    // Já existe 1 admin, então precisamos criar apenas 4 membros para atingir o limite
    // (1 admin + 4 novos = 5 membros = limite)
    for (let i = 0; i < 4; i++) {
      const timestamp = Date.now()
      const user = await prisma.user.create({
        data: {
          name: `Member ${i}`,
          email: `limitmember${i}_${timestamp}@test.com`,
          password: await bcrypt.hash('password123', 10),
        },
      })

      await prisma.member.create({
        data: {
          name: `Member ${i}`,
          email: `limitmember${i}_${timestamp}@test.com`,
          role: 'MEMBER',
          branchId,
          userId: user.id,
        },
      })
    }

    // Agora temos 5 membros (1 admin + 4 criados), que é o limite
    // Tentar criar mais um deve retornar LIMIT_REACHED
    const newEmail = `limitmember-${Date.now()}@test.com`

    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Membro Limite',
        email: newEmail,
        password: 'senha123456',
        inviteToken: inviteLink.token,
      },
    })

    expect(response.statusCode).toBe(403)
    const data = JSON.parse(response.body)
    expect(data.error).toBe('LIMIT_REACHED')
    expect(data.message).toContain('limite de membros')
  })

  it('deve retornar 400 se email já estiver cadastrado', async () => {
    const existingEmail = 'existing@test.com'

    // Criar membro existente
    const user = await prisma.user.create({
      data: {
        name: 'Existing User',
        email: existingEmail,
        password: await bcrypt.hash('password123', 10),
      },
    })

    await prisma.member.create({
      data: {
        name: 'Existing Member',
        email: existingEmail,
        role: 'MEMBER',
        branchId,
        userId: user.id,
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Novo Membro',
        email: existingEmail,
        password: 'senha123456',
        inviteToken: inviteLink.token,
      },
    })

    expect(response.statusCode).toBe(400)
    const data = JSON.parse(response.body)
    expect(data.error).toContain('já cadastrado')
  })

  it('deve retornar 400 se token não for fornecido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Novo Membro',
        email: 'test@test.com',
        password: 'senha123456',
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('deve retornar 404 se link não for encontrado', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Novo Membro',
        email: 'test@test.com',
        password: 'senha123456',
        inviteToken: 'invalid_token_12345',
      },
    })

    expect(response.statusCode).toBe(404)
  })

  it('deve retornar 403 se link estiver desativado', async () => {
    await prisma.memberInviteLink.update({
      where: { id: inviteLink.id },
      data: { isActive: false },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Novo Membro',
        email: 'test@test.com',
        password: 'senha123456',
        inviteToken: inviteLink.token,
      },
    })

    expect(response.statusCode).toBe(403)
    const data = JSON.parse(response.body)
    expect(data.error).toContain('desativado')
  })

  it('deve retornar 403 se link expirou', async () => {
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 1)

    await prisma.memberInviteLink.update({
      where: { id: inviteLink.id },
      data: { expiresAt: expiredDate },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Novo Membro',
        email: 'test@test.com',
        password: 'senha123456',
        inviteToken: inviteLink.token,
      },
    })

    expect(response.statusCode).toBe(403)
    const data = JSON.parse(response.body)
    expect(data.error).toContain('expirou')
  })

  it('deve retornar 403 se limite de usos foi atingido', async () => {
    await prisma.memberInviteLink.update({
      where: { id: inviteLink.id },
      data: { currentUses: 10 },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Novo Membro',
        email: 'test@test.com',
        password: 'senha123456',
        inviteToken: inviteLink.token,
      },
    })

    expect(response.statusCode).toBe(403)
    const data = JSON.parse(response.body)
    expect(data.error).toContain('limite de usos')
  })

  it('deve retornar 403 com PLAN_LIMIT_REACHED quando limite de membros do plano for atingido durante registro', async () => {
    // Criar membros até atingir o limite (5 membros)
    const timestamp = Date.now()
    for (let i = 0; i < 5; i++) {
      const user = await prisma.user.create({
        data: {
          name: `Member ${i}`,
          email: `limitmember${i}_${timestamp}@test.com`,
          password: await bcrypt.hash('password123', 10),
        },
      })

      await prisma.member.create({
        data: {
          name: `Member ${i}`,
          email: `limitmember${i}_${timestamp}@test.com`,
          role: 'MEMBER',
          branchId,
          userId: user.id,
        },
      })
    }

    const newEmail = `limitmember-${Date.now()}@test.com`

    const response = await app.inject({
      method: 'POST',
      url: '/public/register/invite',
      payload: {
        name: 'Membro Limite',
        email: newEmail,
        password: 'senha123456',
        inviteToken: inviteLink.token,
      },
    })

    expect(response.statusCode).toBe(403)
    const data = JSON.parse(response.body)
    expect(data.error).toBe('LIMIT_REACHED')
    expect(data.message).toContain('limite de membros')
  })
})

