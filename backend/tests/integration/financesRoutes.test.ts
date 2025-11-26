import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { authenticate } from '../../src/middlewares/authenticate'

describe('Finances Routes', () => {
  const app = Fastify()
  let userToken: string
  let userId: string
  let branchId: string
  let memberId: string
  let churchId: string

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'churchapp-secret-key'
    }

    app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'churchapp-secret-key',
    })

    app.decorate('authenticate', authenticate)

    await registerRoutes(app)
    await app.ready()

    await resetTestDatabase()

    // Criar plano
    const plan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } }) || 
      await prisma.plan.create({
        data: {
          name: 'Free Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 10,
          maxBranches: 1,
        },
      })

    // Criar igreja
    const church = await prisma.church.create({
      data: {
        name: 'Igreja Teste',
      },
    })
    churchId = church.id

    // Criar filial
    const branch = await prisma.branch.create({
      data: {
        name: 'Filial Teste',
        churchId: church.id,
      },
    })
    branchId = branch.id

    // Criar usuário
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      },
    })
    userId = user.id

    // Criar membro com permissão finances_manage
    const member = await prisma.member.create({
      data: {
        name: 'Test Member',
        email: 'member@example.com',
        branchId: branch.id,
        role: 'ADMINFILIAL',
        userId: user.id,
        Permission: {
          create: { type: 'finances_manage' },
        },
      },
      include: { Permission: true },
    })
    memberId = member.id

    // Gerar token
    userToken = app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'user',
      memberId: member.id,
      role: member.role,
      branchId: member.branchId,
      churchId: church.id,
      permissions: member.Permission.map(p => p.type),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /finances', () => {
    it('deve retornar lista vazia e resumo zerado quando não há transações', async () => {
      const response = await request(app.server)
        .get('/finances')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('transactions')
      expect(response.body).toHaveProperty('summary')
      expect(response.body.transactions).toEqual([])
      expect(response.body.summary).toEqual({
        total: 0,
        entries: 0,
        exits: 0,
      })
    })

    it('deve retornar transações e resumo correto', async () => {
      // Criar transações
      await prisma.transaction.createMany({
        data: [
          {
            title: 'Entrada 1',
            amount: 1000.0,
            type: 'ENTRY',
            branchId: branchId,
          },
          {
            title: 'Entrada 2',
            amount: 500.0,
            type: 'ENTRY',
            branchId: branchId,
          },
          {
            title: 'Saída 1',
            amount: 300.0,
            type: 'EXIT',
            branchId: branchId,
          },
        ],
      })

      const response = await request(app.server)
        .get('/finances')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('transactions')
      expect(response.body).toHaveProperty('summary')
      expect(response.body.transactions.length).toBe(3)
      expect(response.body.summary.entries).toBe(1500.0)
      expect(response.body.summary.exits).toBe(300.0)
      expect(response.body.summary.total).toBe(1200.0)
    })

    it('deve retornar 400 quando usuário não tem branchId', async () => {
      const userWithoutMember = await prisma.user.create({
        data: {
          name: 'User Without Member',
          email: 'nowmember@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const tokenWithoutMember = app.jwt.sign({
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: userWithoutMember.name,
        type: 'user',
      })

      const response = await request(app.server)
        .get('/finances')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Usuário não vinculado a uma filial.')
    })
  })

  describe('POST /finances', () => {
    it('deve criar transação de entrada com sucesso', async () => {
      const transactionData = {
        title: 'Dízimo Recebido',
        amount: 500.0,
        type: 'ENTRY',
        category: 'Dízimo',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Dízimo Recebido')
      expect(response.body).toHaveProperty('amount', 500.0)
      expect(response.body).toHaveProperty('type', 'ENTRY')
      expect(response.body).toHaveProperty('category', 'Dízimo')
      expect(response.body).toHaveProperty('branchId', branchId)
    })

    it('deve criar transação de saída com sucesso', async () => {
      const transactionData = {
        title: 'Pagamento de Conta',
        amount: 200.0,
        type: 'EXIT',
        category: 'Despesas',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Pagamento de Conta')
      expect(response.body).toHaveProperty('amount', 200.0)
      expect(response.body).toHaveProperty('type', 'EXIT')
      expect(response.body).toHaveProperty('category', 'Despesas')
    })

    it('deve criar transação sem categoria', async () => {
      const transactionData = {
        title: 'Transação Sem Categoria',
        amount: 100.0,
        type: 'ENTRY',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.category).toBeNull()
    })

    it('deve retornar 400 quando dados inválidos', async () => {
      const transactionData = {
        title: '',
        amount: -10, // Valor negativo
        type: 'ENTRY',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve retornar 400 quando tipo inválido', async () => {
      const transactionData = {
        title: 'Transação',
        amount: 100.0,
        type: 'INVALID',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve retornar 403 quando usuário não tem permissão', async () => {
      const userWithoutPermission = await prisma.user.create({
        data: {
          name: 'User No Permission',
          email: 'nopermission@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const memberWithoutPermission = await prisma.member.create({
        data: {
          name: 'Member No Permission',
          email: 'membernoperm@example.com',
          branchId: branchId,
          role: 'MEMBER',
          userId: userWithoutPermission.id,
        },
      })

      const tokenWithoutPermission = app.jwt.sign({
        sub: userWithoutPermission.id,
        email: userWithoutPermission.email,
        name: userWithoutPermission.name,
        type: 'user',
        memberId: memberWithoutPermission.id,
        role: memberWithoutPermission.role,
        branchId: memberWithoutPermission.branchId,
        churchId: churchId,
        permissions: [],
      })

      const transactionData = {
        title: 'Transação',
        amount: 100.0,
        type: 'ENTRY',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${tokenWithoutPermission}`)
        .send(transactionData)

      expect(response.status).toBe(403)
    })
  })
})

