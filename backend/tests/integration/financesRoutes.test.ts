import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { authenticate } from '../../src/middlewares/authenticate'
import { logTestResponse } from '../utils/testResponseHelper'

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

      logTestResponse(response, 200)
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

      logTestResponse(response, 200)
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

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Usuário não vinculado a uma filial.')
    })
  })

  describe('POST /finances', () => {
    it('deve criar transação de entrada com tipo OFERTA', async () => {
      const transactionData = {
        title: 'Oferta Recebida',
        amount: 500.0,
        type: 'ENTRY',
        entryType: 'OFERTA',
        category: 'Oferta',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Oferta Recebida')
      expect(response.body).toHaveProperty('amount', 500.0)
      expect(response.body).toHaveProperty('type', 'ENTRY')
      expect(response.body).toHaveProperty('entryType', 'OFERTA')
      expect(response.body).toHaveProperty('category', 'Oferta')
      expect(response.body).toHaveProperty('branchId', branchId)
    })

    it('deve criar transação de entrada com tipo DIZIMO e dizimista membro', async () => {
      // Criar um membro para usar como dizimista
      const tithePayerMember = await prisma.member.create({
        data: {
          name: 'Dizimista Teste',
          email: 'dizimista@example.com',
          branchId: branchId,
          role: 'MEMBER',
        },
      })

      const transactionData = {
        title: 'Dízimo Recebido',
        amount: 1000.0,
        type: 'ENTRY',
        entryType: 'DIZIMO',
        category: 'Dízimo',
        tithePayerMemberId: tithePayerMember.id,
        isTithePayerMember: true,
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Dízimo Recebido')
      expect(response.body).toHaveProperty('amount', 1000.0)
      expect(response.body).toHaveProperty('type', 'ENTRY')
      expect(response.body).toHaveProperty('entryType', 'DIZIMO')
      expect(response.body).toHaveProperty('tithePayerMemberId', tithePayerMember.id)
      expect(response.body).toHaveProperty('isTithePayerMember', true)
    })

    it('deve criar transação de entrada com tipo DIZIMO e dizimista não membro', async () => {
      const transactionData = {
        title: 'Dízimo Recebido',
        amount: 1000.0,
        type: 'ENTRY',
        entryType: 'DIZIMO',
        category: 'Dízimo',
        tithePayerName: 'Visitante Silva',
        isTithePayerMember: false,
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Dízimo Recebido')
      expect(response.body).toHaveProperty('type', 'ENTRY')
      expect(response.body).toHaveProperty('entryType', 'DIZIMO')
      expect(response.body).toHaveProperty('tithePayerName', 'Visitante Silva')
      expect(response.body).toHaveProperty('isTithePayerMember', false)
    })

    it('deve criar transação de saída com sucesso', async () => {
      const transactionData = {
        title: 'Pagamento de Conta',
        amount: 200.0,
        type: 'EXIT',
        category: 'Despesas',
        exitType: 'ALUGUEL',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 201)
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
        entryType: 'OFERTA',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.category).toBeNull()
    })

    it('deve retornar 400 quando ENTRY não tem entryType', async () => {
      const transactionData = {
        title: 'Transação Sem EntryType',
        amount: 100.0,
        type: 'ENTRY',
        // entryType ausente
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve retornar 400 quando DIZIMO não tem dizimista', async () => {
      const transactionData = {
        title: 'Dízimo Sem Dizimista',
        amount: 1000.0,
        type: 'ENTRY',
        entryType: 'DIZIMO',
        // tithePayerMemberId e tithePayerName ausentes
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve retornar 400 quando DIZIMO tem isTithePayerMember=true mas sem tithePayerMemberId', async () => {
      const transactionData = {
        title: 'Dízimo Inválido',
        amount: 1000.0,
        type: 'ENTRY',
        entryType: 'DIZIMO',
        isTithePayerMember: true,
        // tithePayerMemberId ausente
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve retornar 400 quando DIZIMO tem isTithePayerMember=false mas sem tithePayerName', async () => {
      const transactionData = {
        title: 'Dízimo Inválido',
        amount: 1000.0,
        type: 'ENTRY',
        entryType: 'DIZIMO',
        isTithePayerMember: false,
        // tithePayerName ausente
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
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

      logTestResponse(response, 400)
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

      logTestResponse(response, 400)
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

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
    })
  })

  describe('GET /finances/:id', () => {
    it('deve retornar transação específica por ID', async () => {
      const transaction = await prisma.transaction.create({
        data: {
          title: 'Transação Teste',
          amount: 500.0,
          type: 'ENTRY',
          entryType: 'OFERTA',
          branchId: branchId,
          createdBy: userId,
        },
      })

      const response = await request(app.server)
        .get(`/finances/${transaction.id}`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', transaction.id)
      expect(response.body).toHaveProperty('title', 'Transação Teste')
      expect(response.body).toHaveProperty('amount', 500.0)
      expect(response.body).toHaveProperty('CreatedByUser')
    })

    it('deve retornar 404 quando transação não existe', async () => {
      const response = await request(app.server)
        .get('/finances/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 404)
      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('message', 'Transação não encontrada')
    })
  })

  describe('PUT /finances/:id', () => {
    it('deve atualizar transação com sucesso', async () => {
      const transaction = await prisma.transaction.create({
        data: {
          title: 'Transação Original',
          amount: 500.0,
          type: 'ENTRY',
          entryType: 'OFERTA',
          branchId: branchId,
          createdBy: userId,
        },
      })

      const updateData = {
        title: 'Transação Atualizada',
        amount: 750.0,
        category: 'Nova Categoria',
      }

      const response = await request(app.server)
        .put(`/finances/${transaction.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('title', 'Transação Atualizada')
      expect(response.body).toHaveProperty('amount', 750.0)
      expect(response.body).toHaveProperty('category', 'Nova Categoria')
    })

    it('deve atualizar tipo de saída com exitType', async () => {
      const transaction = await prisma.transaction.create({
        data: {
          title: 'Saída Original',
          amount: 200.0,
          type: 'EXIT',
          branchId: branchId,
          createdBy: userId,
        },
      })

      const updateData = {
        exitType: 'ALUGUEL',
      }

      const response = await request(app.server)
        .put(`/finances/${transaction.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('exitType', 'ALUGUEL')
    })

    it('deve retornar 404 quando transação não existe', async () => {
      const response = await request(app.server)
        .put('/finances/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Teste' })

      logTestResponse(response, 404)
      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /finances/:id', () => {
    it('deve excluir transação com sucesso', async () => {
      const transaction = await prisma.transaction.create({
        data: {
          title: 'Transação para Excluir',
          amount: 300.0,
          type: 'ENTRY',
          entryType: 'OFERTA',
          branchId: branchId,
          createdBy: userId,
        },
      })

      const response = await request(app.server)
        .delete(`/finances/${transaction.id}`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 204)
      expect(response.status).toBe(204)

      // Verificar que foi excluída
      const deleted = await prisma.transaction.findUnique({
        where: { id: transaction.id },
      })
      expect(deleted).toBeNull()
    })

    it('deve retornar 404 quando transação não existe', async () => {
      const response = await request(app.server)
        .delete('/finances/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 404)
      expect(response.status).toBe(404)
    })
  })

  describe('GET /finances com filtros', () => {
    beforeEach(async () => {
      // Limpar transações anteriores
      await prisma.transaction.deleteMany({ where: { branchId } })
    })

    it('deve filtrar por intervalo de datas', async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      await prisma.transaction.createMany({
        data: [
          {
            title: 'Transação do Mês',
            amount: 500.0,
            type: 'ENTRY',
            entryType: 'OFERTA',
            branchId: branchId,
            createdAt: new Date(),
          },
          {
            title: 'Transação Antiga',
            amount: 300.0,
            type: 'ENTRY',
            entryType: 'OFERTA',
            branchId: branchId,
            createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 15),
          },
        ],
      })

      const response = await request(app.server)
        .get('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.transactions.length).toBe(1)
      expect(response.body.transactions[0].title).toBe('Transação do Mês')
    })

    it('deve filtrar por categoria', async () => {
      await prisma.transaction.createMany({
        data: [
          {
            title: 'Transação Categoria A',
            amount: 500.0,
            type: 'ENTRY',
            entryType: 'OFERTA',
            category: 'Categoria A',
            branchId: branchId,
          },
          {
            title: 'Transação Categoria B',
            amount: 300.0,
            type: 'ENTRY',
            entryType: 'OFERTA',
            category: 'Categoria B',
            branchId: branchId,
          },
        ],
      })

      const response = await request(app.server)
        .get('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ category: 'Categoria A' })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.transactions.length).toBe(1)
      expect(response.body.transactions[0].category).toBe('Categoria A')
    })

    it('deve filtrar por tipo (ENTRY/EXIT)', async () => {
      await prisma.transaction.createMany({
        data: [
          {
            title: 'Entrada',
            amount: 500.0,
            type: 'ENTRY',
            entryType: 'OFERTA',
            branchId: branchId,
          },
          {
            title: 'Saída',
            amount: 300.0,
            type: 'EXIT',
            exitType: 'ALUGUEL',
            branchId: branchId,
          },
        ],
      })

      const response = await request(app.server)
        .get('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ type: 'ENTRY' })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.transactions.length).toBe(1)
      expect(response.body.transactions[0].type).toBe('ENTRY')
    })

    it('deve pesquisar por título', async () => {
      await prisma.transaction.createMany({
        data: [
          {
            title: 'Dízimo de João',
            amount: 500.0,
            type: 'ENTRY',
            entryType: 'DIZIMO',
            branchId: branchId,
          },
          {
            title: 'Oferta de Maria',
            amount: 300.0,
            type: 'ENTRY',
            entryType: 'OFERTA',
            branchId: branchId,
          },
        ],
      })

      const response = await request(app.server)
        .get('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ search: 'João' })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.transactions.length).toBe(1)
      expect(response.body.transactions[0].title).toBe('Dízimo de João')
    })
  })

  describe('POST /finances - Novos campos', () => {
    it('deve criar transação de saída com exitType ALUGUEL', async () => {
      const transactionData = {
        title: 'Pagamento de Aluguel',
        amount: 1500.0,
        type: 'EXIT',
        exitType: 'ALUGUEL',
        category: 'Despesas',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('exitType', 'ALUGUEL')
    })

    it('deve criar transação de saída com exitType OUTROS e exitTypeOther', async () => {
      const transactionData = {
        title: 'Outra Despesa',
        amount: 200.0,
        type: 'EXIT',
        exitType: 'OUTROS',
        exitTypeOther: 'Material de limpeza',
        category: 'Despesas',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('exitType', 'OUTROS')
      expect(response.body).toHaveProperty('exitTypeOther', 'Material de limpeza')
    })

    it('deve retornar 400 quando exitType é OUTROS mas exitTypeOther está vazio', async () => {
      const transactionData = {
        title: 'Outra Despesa',
        amount: 200.0,
        type: 'EXIT',
        exitType: 'OUTROS',
        exitTypeOther: '',
        category: 'Despesas',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve criar transação de entrada com tipo CONTRIBUICAO', async () => {
      // Criar contribuição primeiro
      const contribution = await prisma.contribution.create({
        data: {
          title: 'Contribuição Teste',
          goal: 1000.0,
          endDate: new Date(),
          isActive: true,
          branchId: branchId,
        },
      })

      const transactionData = {
        title: 'Transação de Contribuição',
        amount: 500.0,
        type: 'ENTRY',
        entryType: 'CONTRIBUICAO',
        contributionId: contribution.id,
        category: 'Contribuição',
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('entryType', 'CONTRIBUICAO')
      expect(response.body).toHaveProperty('contributionId', contribution.id)
    })

    it('deve retornar 400 quando CONTRIBUICAO não tem contributionId', async () => {
      const transactionData = {
        title: 'Transação de Contribuição',
        amount: 500.0,
        type: 'ENTRY',
        entryType: 'CONTRIBUICAO',
        // contributionId ausente
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve retornar 400 quando EXIT não tem exitType', async () => {
      const transactionData = {
        title: 'Saída Sem Tipo',
        amount: 200.0,
        type: 'EXIT',
        // exitType ausente
      }

      const response = await request(app.server)
        .post('/finances')
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })
  })
})

