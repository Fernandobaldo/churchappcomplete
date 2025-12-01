import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { authenticate } from '../../src/middlewares/authenticate'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { logTestResponse } from '../utils/testResponseHelper'
import { seedTestDatabase } from '../utils/seedTestDatabase'

describe('Invite Link Routes', () => {
  const app = Fastify()
  let adminToken: string
  let adminUserId: string
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
    
    // Criar plano com limite maior ANTES do seed para garantir que seja usado
    let plan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
    if (plan) {
      // Atualizar limite se já existir
      plan = await prisma.plan.update({
        where: { id: plan.id },
        data: { maxMembers: 100 },
      })
    } else {
      plan = await prisma.plan.create({
        data: {
          name: 'Free Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 100,
          maxBranches: 1,
        },
      })
    }

    await seedTestDatabase()

    // Garantir que o plano ainda tem o limite correto após o seed
    plan = await prisma.plan.update({
      where: { id: plan.id },
      data: { maxMembers: 100 },
    })

    // Criar User e Member admin
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.com',
        password: hashedPassword,
        Subscription: {
          create: {
            planId: plan.id,
            status: 'active',
          },
        },
      },
    })

    adminUserId = user.id

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
    const adminMember = await prisma.member.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.com',
        role: 'ADMINGERAL',
        branchId: branch.id,
        userId: user.id,
      },
    })

    // Criar token
    adminToken = app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'member',
      memberId: adminMember.id,
      role: 'ADMINGERAL',
      branchId: branch.id,
      churchId: church.id,
      permissions: [],
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  afterEach(async () => {
    // Restaurar o plano para maxMembers: 100 após cada teste
    // para evitar que testes que modificam o plano afetem outros testes
    const plan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
    if (plan) {
      await prisma.plan.update({
        where: { id: plan.id },
        data: { maxMembers: 100 },
      })
    }
  })

  describe('POST /invite-links', () => {
    it('deve criar um link de convite com sucesso', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invite-links',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          branchId,
          maxUses: 10,
        },
      })

      logTestResponse(response, 201)
      expect(response.statusCode).toBe(201)
      const data = JSON.parse(response.body)
      expect(data.token).toBeDefined()
      expect(data.branchId).toBe(branchId)
      expect(data.maxUses).toBe(10)
      expect(data.isActive).toBe(true)
    })

    it('deve criar link ilimitado quando maxUses for null', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invite-links',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          branchId,
          maxUses: null,
        },
      })

      logTestResponse(response, 201)
      expect(response.statusCode).toBe(201)
      const data = JSON.parse(response.body)
      expect(data.maxUses).toBeNull()
    })

    it('deve retornar 401 se não autenticado', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/invite-links',
        payload: {
          branchId,
        },
      })

      logTestResponse(response, 401)
      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 403 se não tiver permissão', async () => {
      // Criar membro sem permissão
      const memberUser = await prisma.user.create({
        data: {
          name: 'Member Test',
          email: 'member@test.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const member = await prisma.member.create({
        data: {
          name: 'Member Test',
          email: 'member@test.com',
          role: 'MEMBER',
          branchId,
          userId: memberUser.id,
        },
      })

      const memberToken = app.jwt.sign({
        sub: memberUser.id,
        email: memberUser.email,
        name: memberUser.name,
        type: 'member',
        memberId: member.id,
        role: 'MEMBER',
        branchId,
        churchId,
        permissions: [],
      })

      const response = await app.inject({
        method: 'POST',
        url: '/invite-links',
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
        payload: {
          branchId,
        },
      })

      logTestResponse(response, 403)
      expect(response.statusCode).toBe(403)
    })

    it('deve retornar 403 com código PLAN_LIMIT_REACHED quando limite de membros for atingido', async () => {
      // Criar membros até atingir o limite do plano (10 membros)
      const plan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
      if (!plan) {
        throw new Error('Plano não encontrado')
      }

      // Atualizar plano para ter limite de 5 membros para facilitar o teste
      await prisma.plan.update({
        where: { id: plan.id },
        data: { maxMembers: 5 },
      })

      // Criar 5 membros para atingir o limite
      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            name: `Member ${i}`,
            email: `member${i}@test.com`,
            password: await bcrypt.hash('password123', 10),
            Subscription: {
              create: {
                planId: plan.id,
                status: 'active',
              },
            },
          },
        })

        await prisma.member.create({
          data: {
            name: `Member ${i}`,
            email: `member${i}@test.com`,
            role: 'MEMBER',
            branchId,
            userId: user.id,
          },
        })
      }

      const response = await app.inject({
        method: 'POST',
        url: '/invite-links',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          branchId,
        },
      })

      logTestResponse(response, 403)
      expect(response.statusCode).toBe(403)
      const data = JSON.parse(response.body)
      expect(data.code).toBe('PLAN_LIMIT_REACHED')
      expect(data.error).toBe('PLAN_LIMIT_REACHED')
      expect(data.message).toContain('Limite de membros do plano atingido')
      expect(data.message).toContain('upgrade')
    })
  })

  describe('GET /invite-links/branch/:branchId', () => {
    it('deve listar links de uma filial', async () => {
      // Criar um link primeiro
      await app.inject({
        method: 'POST',
        url: '/invite-links',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          branchId,
        },
      })

      const response = await app.inject({
        method: 'GET',
        url: `/invite-links/branch/${branchId}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      logTestResponse(response, 200)
      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe('PATCH /invite-links/:id/deactivate', () => {
    it('deve desativar um link com sucesso', async () => {
      // Criar link
      const createResponse = await app.inject({
        method: 'POST',
        url: '/invite-links',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          branchId,
        },
      })

      expect(createResponse.statusCode).toBe(201)
      const linkData = JSON.parse(createResponse.body)
      expect(linkData.id).toBeDefined()

      // Desativar link
      const response = await app.inject({
        method: 'PATCH',
        url: `/invite-links/${linkData.id}/deactivate`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      logTestResponse(response, 200)
      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.isActive).toBe(false)
    })
  })

  describe('GET /invite-links/:token/info', () => {
    it('deve retornar informações do link (público)', async () => {
      // Criar link
      const createResponse = await app.inject({
        method: 'POST',
        url: '/invite-links',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          branchId,
        },
      })

      // Verificar se a criação foi bem-sucedida
      if (createResponse.statusCode !== 201) {
        console.error('❌ Erro ao criar link:', createResponse.statusCode, createResponse.body)
        console.error('❌ Headers:', createResponse.headers)
      }
      expect(createResponse.statusCode).toBe(201)
      
      // Verificar se o body não está vazio
      if (!createResponse.body || createResponse.body === '{}') {
        console.error('❌ Body está vazio! Status:', createResponse.statusCode)
        console.error('❌ Headers:', JSON.stringify(createResponse.headers, null, 2))
      }
      
      const linkData = JSON.parse(createResponse.body)
      expect(linkData.token).toBeDefined()
      expect(linkData.id).toBeDefined()

      // Aguardar um pouco para garantir que o link foi persistido
      await new Promise(resolve => setTimeout(resolve, 100))

      // Buscar informações (sem autenticação)
      const response = await app.inject({
        method: 'GET',
        url: `/invite-links/${linkData.token}/info`,
      })

      if (response.statusCode !== 200) {
        console.error('❌ Erro ao buscar informações do link:', response.statusCode, response.body)
      }

      logTestResponse(response, 200)
      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.id).toBe(linkData.id)
      expect(data.branchName).toBeDefined()
      expect(data.churchName).toBeDefined()
    })
  })

  describe('GET /invite-links/:token/qrcode', () => {
    it('deve retornar QR code como imagem PNG', async () => {
      // Garantir que o plano está com o limite correto antes de iniciar o teste
      const plan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
      if (plan && plan.maxMembers !== 100) {
        await prisma.plan.update({
          where: { id: plan.id },
          data: { maxMembers: 100 },
        })
      }
      
      // Criar link
      const createResponse = await app.inject({
        method: 'POST',
        url: '/invite-links',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          branchId,
        },
      })

      expect(createResponse.statusCode).toBe(201)
      const linkData = JSON.parse(createResponse.body)
      expect(linkData.token).toBeDefined()
      expect(linkData.id).toBeDefined()

      // Aguardar um pouco para garantir que o link foi persistido
      await new Promise(resolve => setTimeout(resolve, 100))

      // Buscar QR code (sem autenticação)
      const response = await app.inject({
        method: 'GET',
        url: `/invite-links/${linkData.token}/qrcode`,
      })

      if (response.statusCode !== 200) {
        console.error('❌ Erro ao buscar QR code:', response.statusCode, response.body)
      }

      logTestResponse(response, 200)
      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('image/png')
    })
  })
})

