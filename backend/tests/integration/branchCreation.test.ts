import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import request from 'supertest'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { seedTestDatabase } from '../utils/seedTestDatabase'
import { authenticate } from '../../src/middlewares/authenticate'

describe('Branch Creation - Validações de Segurança', () => {
  const app = Fastify()

  let testData: Awaited<ReturnType<typeof seedTestDatabase>>
  let adminToken: string
  let adminBranchId: string
  let adminUserId: string
  let adminChurchId: string
  let adminFilialToken: string

  beforeAll(async () => {
    app.register(fastifyJwt, {
      secret: 'churchapp-secret-key',
    })

    // Usa o middleware authenticate do projeto que popula request.user corretamente
    app.decorate('authenticate', authenticate)

    // Registra todas as rotas da aplicação
    await registerRoutes(app)
    await app.ready()

    await resetTestDatabase()
    testData = await seedTestDatabase()

    // Criar dados adicionais para testes
    const plan = await prisma.plan.findFirst()
    if (!plan) throw new Error('Plano não encontrado')

    // Criar User e Member ADMINGERAL
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin Geral',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        Subscription: {
          create: {
            planId: plan.id,
            status: 'active',
          },
        },
      },
    })

    const church = await prisma.church.create({
      data: {
        name: 'Igreja Admin',
      },
    })

    adminChurchId = church.id

    const branch = await prisma.branch.create({
      data: {
        name: 'Sede',
        churchId: church.id,
        isMainBranch: true,
      },
    })

    adminBranchId = branch.id
    adminUserId = adminUser.id

    // NOVO MODELO: Member não tem senha (usa senha do User)
    const adminMember = await prisma.member.create({
      data: {
        name: 'Admin Geral',
        email: 'admin@example.com',
        role: 'ADMINGERAL',
        branchId: branch.id,
        userId: adminUser.id,
      },
    })

    // Criar token JWT para admin
    adminToken = app.jwt.sign({
      sub: adminUser.id,
      userId: adminUser.id,
      email: adminUser.email,
      memberId: adminMember.id,
      role: 'ADMINGERAL',
      branchId: branch.id,
      permissions: [],
    })

    // Criar ADMINFILIAL
    const adminFilialUser = await prisma.user.create({
      data: {
        name: 'Admin Filial',
        email: 'adminfilial@example.com',
        password: await bcrypt.hash('password123', 10),
        Subscription: {
          create: {
            planId: plan.id,
            status: 'active',
          },
        },
      },
    })

    // NOVO MODELO: Member não tem senha (usa senha do User)
    const adminFilialMember = await prisma.member.create({
      data: {
        name: 'Admin Filial',
        email: 'adminfilial@example.com',
        role: 'ADMINFILIAL',
        branchId: branch.id,
        userId: adminFilialUser.id,
      },
    })

    adminFilialToken = app.jwt.sign({
      sub: adminFilialUser.id,
      userId: adminFilialUser.id,
      email: adminFilialUser.email,
      memberId: adminFilialMember.id,
      role: 'ADMINFILIAL',
      branchId: branch.id,
      permissions: [],
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('Validação de Autorização', () => {
    it('deve retornar 401 se não estiver autenticado', async () => {
      const response = await request(app.server)
        .post('/branches')
        .send({
          name: 'Nova Filial',
          churchId: adminChurchId,
        })

      expect(response.status).toBe(401)
    })

    it('deve permitir ADMINGERAL criar branch', async () => {
      // Verificar se já existe branch e deletar se necessário para não exceder limite
      const existingBranches = await prisma.branch.findMany({
        where: { churchId: adminChurchId },
      })
      
      // Se já existe 1 branch e o limite é 1, precisamos deletar ou aumentar limite
      const plan = await prisma.plan.findFirst()
      if (plan && plan.maxBranches === 1 && existingBranches.length >= 1) {
        // Aumentar limite temporariamente para o teste
        await prisma.plan.update({
          where: { id: plan.id },
          data: { maxBranches: 2 },
        })
      }

      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nova Filial',
          churchId: adminChurchId,
        })

      expect(response.status).toBe(201)
      expect(response.body.name).toBe('Nova Filial')
    })

    it('deve retornar 403 se ADMINFILIAL tentar criar branch', async () => {
      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${adminFilialToken}`)
        .send({
          name: 'Filial Não Autorizada',
          churchId: adminChurchId,
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toContain('Administradores Gerais')
    })

    it('deve retornar 403 se tentar criar branch para outra igreja', async () => {
      // Criar outra igreja
      const otherChurch = await prisma.church.create({
        data: {
          name: 'Outra Igreja',
        },
      })

      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Filial Outra Igreja',
          churchId: otherChurch.id,
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toContain('outras igrejas')
    })
  })

  describe('Validação de Limites de Plano', () => {
    it('deve retornar 403 quando limite de branches é excedido', async () => {
      const plan = await prisma.plan.findFirst()
      if (!plan) throw new Error('Plano não encontrado')

      // Atualizar plano para ter limite de 1 branch (já temos 1)
      await prisma.plan.update({
        where: { id: plan.id },
        data: { maxBranches: 1 },
      })

      // Tentar criar mais uma branch (deve falhar)
      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Filial Excedente',
          churchId: adminChurchId,
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toContain('Limite do plano atingido')

      // Restaurar limite original
      await prisma.plan.update({
        where: { id: plan.id },
        data: { maxBranches: 1 },
      })
    })

    it('deve permitir criar branch quando maxBranches é null (ilimitado)', async () => {
      const plan = await prisma.plan.findFirst()
      if (!plan) throw new Error('Plano não encontrado')

      // Salvar limite original
      const originalLimit = plan.maxBranches

      // Atualizar plano para ter limite ilimitado
      await prisma.plan.update({
        where: { id: plan.id },
        data: { maxBranches: null },
      })

      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Filial Ilimitada',
          churchId: adminChurchId,
        })

      expect(response.status).toBe(201)

      // Restaurar limite original
      await prisma.plan.update({
        where: { id: plan.id },
        data: { maxBranches: originalLimit },
      })
    })
  })
})

