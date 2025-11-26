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

describe('Contributions Routes', () => {
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

    // Criar membro com permissão contributions_manage
    const member = await prisma.member.create({
      data: {
        name: 'Test Member',
        email: 'member@example.com',
        branchId: branch.id,
        role: 'ADMINFILIAL',
        userId: user.id,
        Permission: {
          create: { type: 'contributions_manage' },
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

  describe('GET /contributions', () => {
    it('deve retornar lista vazia quando não há contribuições', async () => {
      const response = await request(app.server)
        .get('/contributions')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })

    it('deve retornar contribuições da filial do usuário', async () => {
      // Criar contribuição
      const contribution = await prisma.contribution.create({
        data: {
          title: 'Dízimo',
          description: 'Dízimo do mês',
          value: 100.0,
          date: new Date('2024-01-15'),
          type: 'DIZIMO',
          branchId: branchId,
        },
      })

      const response = await request(app.server)
        .get('/contributions')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('title', 'Dízimo')
      expect(response.body[0]).toHaveProperty('value', 100.0)
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
        .get('/contributions')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Usuário não vinculado a uma filial.')
    })
  })

  describe('GET /contributions/types', () => {
    it('deve retornar lista de tipos de contribuição', async () => {
      const response = await request(app.server)
        .get('/contributions/types')

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBe(3)
      expect(response.body[0]).toHaveProperty('label')
      expect(response.body[0]).toHaveProperty('value')
    })
  })

  describe('POST /contributions', () => {
    it('deve criar contribuição com sucesso', async () => {
      const contributionData = {
        title: 'Oferta',
        description: 'Oferta especial',
        value: 50.0,
        date: '2024-01-15',
        type: 'OFERTA',
      }

      const response = await request(app.server)
        .post('/contributions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(contributionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Oferta')
      expect(response.body).toHaveProperty('value', 50.0)
      expect(response.body).toHaveProperty('type', 'OFERTA')
      expect(response.body).toHaveProperty('branchId', branchId)
    })

    it('deve criar contribuição com formato ISO de data', async () => {
      const contributionData = {
        title: 'Dízimo',
        description: 'Dízimo do mês',
        value: 100.0,
        date: '2024-01-15T00:00:00.000Z',
        type: 'DIZIMO',
      }

      const response = await request(app.server)
        .post('/contributions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(contributionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Dízimo')
    })

    it('deve retornar 400 quando dados inválidos', async () => {
      const contributionData = {
        title: '',
        value: -10, // Valor negativo
        date: '2024-01-15',
        type: 'OFERTA',
      }

      const response = await request(app.server)
        .post('/contributions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(contributionData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve retornar 400 quando usuário não tem branchId', async () => {
      const userWithoutMember = await prisma.user.create({
        data: {
          name: 'User Without Member 2',
          email: 'nowmember2@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const tokenWithoutMember = app.jwt.sign({
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: userWithoutMember.name,
        type: 'user',
      })

      const contributionData = {
        title: 'Oferta',
        value: 50.0,
        date: '2024-01-15',
        type: 'OFERTA',
      }

      const response = await request(app.server)
        .post('/contributions')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)
        .send(contributionData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Usuário não vinculado a uma filial.')
    })

    it('deve retornar 403 quando usuário não tem permissão', async () => {
      // Criar membro sem permissão contributions_manage
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

      const contributionData = {
        title: 'Oferta',
        value: 50.0,
        date: '2024-01-15',
        type: 'OFERTA',
      }

      const response = await request(app.server)
        .post('/contributions')
        .set('Authorization', `Bearer ${tokenWithoutPermission}`)
        .send(contributionData)

      expect(response.status).toBe(403)
    })
  })

  describe('GET /contributions/:id', () => {
    it('deve retornar contribuição por ID', async () => {
      // Criar contribuição
      const contribution = await prisma.contribution.create({
        data: {
          title: 'Dízimo Especial',
          description: 'Dízimo do mês de janeiro',
          value: 200.0,
          date: new Date('2024-01-15'),
          type: 'DIZIMO',
          branchId: branchId,
          goal: 5000.0,
          raised: 2000.0,
          bankName: 'Banco Teste',
          agency: '1234',
          accountName: 'Igreja Teste',
        },
      })

      const response = await request(app.server)
        .get(`/contributions/${contribution.id}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', contribution.id)
      expect(response.body).toHaveProperty('title', 'Dízimo Especial')
      expect(response.body).toHaveProperty('value', 200.0)
      expect(response.body).toHaveProperty('goal', 5000.0)
      expect(response.body).toHaveProperty('raised', 2000.0)
      expect(response.body).toHaveProperty('bankName', 'Banco Teste')
      expect(response.body).toHaveProperty('agency', '1234')
      expect(response.body).toHaveProperty('accountName', 'Igreja Teste')
    })

    it('deve retornar 404 quando contribuição não existe', async () => {
      const fakeId = 'clx123456789012345678901234'
      const response = await request(app.server)
        .get(`/contributions/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('message', 'Contribuição não encontrada')
    })

    it('deve retornar 403 quando contribuição pertence a outra filial', async () => {
      // Criar outra filial
      const otherBranch = await prisma.branch.create({
        data: {
          name: 'Outra Filial',
          churchId: churchId,
        },
      })

      // Criar contribuição na outra filial
      const contribution = await prisma.contribution.create({
        data: {
          title: 'Contribuição Outra Filial',
          value: 100.0,
          date: new Date('2024-01-15'),
          type: 'OFERTA',
          branchId: otherBranch.id,
        },
      })

      const response = await request(app.server)
        .get(`/contributions/${contribution.id}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('message', 'Você não tem permissão para visualizar esta contribuição')
    })

    it('deve retornar 400 quando usuário não tem branchId', async () => {
      const userWithoutMember = await prisma.user.create({
        data: {
          name: 'User Without Member',
          email: 'nowmember3@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const tokenWithoutMember = app.jwt.sign({
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: userWithoutMember.name,
        type: 'user',
      })

      const contribution = await prisma.contribution.create({
        data: {
          title: 'Test',
          value: 100.0,
          date: new Date('2024-01-15'),
          type: 'OFERTA',
          branchId: branchId,
        },
      })

      const response = await request(app.server)
        .get(`/contributions/${contribution.id}`)
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Usuário não vinculado a uma filial.')
    })
  })
})

