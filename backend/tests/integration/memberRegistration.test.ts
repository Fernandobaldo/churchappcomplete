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
import { logTestResponse } from '../utils/testResponseHelper'

describe('Member Registration - Validações de Segurança', () => {
  const app = Fastify()

  let testData: Awaited<ReturnType<typeof seedTestDatabase>>
  let adminToken: string
  let adminBranchId: string
  let adminUserId: string

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
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('Validação de Autorização', () => {
    it('deve retornar 401 se não estiver autenticado', async () => {
      const response = await request(app.server)
        .post('/register')
        .send({
          name: 'Novo Membro',
          email: 'novo@example.com',
          password: 'password123',
          branchId: adminBranchId,
        })

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
    })

    it('deve permitir ADMINGERAL criar membro', async () => {
      const response = await request(app.server)
        .post('/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Novo Membro',
          email: 'novo@example.com',
          password: 'password123',
          branchId: adminBranchId,
          role: 'MEMBER',
        })

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body.email).toBe('novo@example.com')
      expect(response.body.role).toBe('MEMBER')
    })

    it('deve retornar 403 se ADMINFILIAL tentar criar membro em outra filial', async () => {
      // Criar outra filial
      const church = await prisma.church.findFirst()
      if (!church) throw new Error('Igreja não encontrada')

      const otherBranch = await prisma.branch.create({
        data: {
          name: 'Outra Filial',
          churchId: church.id,
        },
      })

      // Criar token para ADMINFILIAL
      const adminFilialUser = await prisma.user.findUnique({
        where: { email: 'adminfilial@example.com' },
        include: { Member: true },
      })

      if (!adminFilialUser?.Member) throw new Error('Admin filial não encontrado')

      const adminFilialToken = app.jwt.sign({
        sub: adminFilialUser.id,
        userId: adminFilialUser.id,
        email: adminFilialUser.email,
        memberId: adminFilialUser.Member.id,
        role: 'ADMINFILIAL',
        branchId: adminFilialUser.Member.branchId,
        permissions: [],
      })

      const response = await request(app.server)
        .post('/register')
        .set('Authorization', `Bearer ${adminFilialToken}`)
        .send({
          name: 'Membro Outra Filial',
          email: 'outro@example.com',
          password: 'password123',
          branchId: otherBranch.id,
        })

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body.error).toContain('sua própria filial')
    })
  })

  describe('Validação de Hierarquia de Roles', () => {
    it('deve retornar 403 se ADMINFILIAL tentar criar ADMINGERAL', async () => {
    const adminFilialUser = await prisma.user.findUnique({
      where: { email: 'adminfilial@example.com' },
      include: { Member: true },
      })

      if (!adminFilialUser?.Member) throw new Error('Admin filial não encontrado')

      const adminFilialToken = app.jwt.sign({
        sub: adminFilialUser.id,
        userId: adminFilialUser.id,
        email: adminFilialUser.email,
        memberId: adminFilialUser.Member.id,
        role: 'ADMINFILIAL',
        branchId: adminFilialUser.Member.branchId,
        permissions: [],
      })

      const response = await request(app.server)
        .post('/register')
        .set('Authorization', `Bearer ${adminFilialToken}`)
        .send({
          name: 'Tentativa Admin Geral',
          email: 'tentativa@example.com',
          password: 'password123',
          branchId: adminFilialUser.Member.branchId,
          role: 'ADMINGERAL',
        })

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body.error).toContain('Administrador Geral')
    })

    it('deve retornar 403 se tentar criar ADMINGERAL (apenas sistema pode)', async () => {
      const response = await request(app.server)
        .post('/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tentativa Admin Geral',
          email: 'tentativa2@example.com',
          password: 'password123',
          branchId: adminBranchId,
          role: 'ADMINGERAL',
        })

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body.error).toContain('Apenas o sistema pode criar')
    })
  })

  describe('Validação de Limites de Plano', () => {
    it('deve retornar 403 quando limite de membros é excedido', async () => {
      // Buscar a igreja do admin para contar membros apenas dessa igreja
      const adminMember = await prisma.member.findFirst({
        where: { userId: adminUserId },
        include: { Branch: true },
      })
      if (!adminMember) throw new Error('Admin member não encontrado')

      const churchId = adminMember.Branch.churchId

      // Contar membros existentes na igreja do admin
      const existingBranches = await prisma.branch.findMany({
        where: { churchId },
        include: { _count: { select: { Member: true } } },
      })
      const existingMembersCount = existingBranches.reduce(
        (sum, b) => sum + b._count.Member,
        0
      )

      // Buscar o plano
      const plan = await prisma.plan.findFirst()
      if (!plan) throw new Error('Plano não encontrado')

      // Atualizar plano para ter limite igual ao número atual de membros + 1
      // Isso garante que ao criar mais 1 membro, o limite será excedido
      const newLimit = existingMembersCount + 1
      await prisma.plan.update({
        where: { id: plan.id },
        data: { maxMembers: newLimit },
      })

      // NOVO MODELO: Criar User primeiro, depois Member associado
      const memberEmail = `membro1-${Date.now()}@example.com`
      const memberUser = await prisma.user.create({
        data: {
          name: 'Membro 1',
          email: memberEmail,
          password: await bcrypt.hash('password123', 10),
        },
      })

      // Criar Member associado ao User (sem senha)
      await prisma.member.create({
        data: {
          name: 'Membro 1',
          email: memberEmail,
          role: 'MEMBER',
          branchId: adminBranchId,
          userId: memberUser.id,
        },
      })

      // Tentar criar mais um membro (deve falhar porque já atingiu o limite)
      const response = await request(app.server)
        .post('/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Membro Excedente',
          email: `excedente-${Date.now()}@example.com`,
          password: 'password123',
          branchId: adminBranchId,
        })

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body.error).toContain('Limite do plano atingido')

      // Restaurar limite original
      await prisma.plan.update({
        where: { id: plan.id },
        data: { maxMembers: 10 },
      })
    })
  })

  describe('Validação de Branch', () => {
    it('deve retornar 400 se branchId não for fornecido', async () => {
      const response = await request(app.server)
        .post('/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Membro Sem Branch',
          email: 'sembranch@example.com',
          password: 'password123',
        })

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
    })

    it('deve retornar 400 se branch não existir', async () => {
      const response = await request(app.server)
        .post('/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Membro Branch Inexistente',
          email: 'branchinexistente@example.com',
          password: 'password123',
          branchId: 'branch-inexistente',
        })

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('não encontrada')
    })
  })
})

