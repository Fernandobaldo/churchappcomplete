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

describe('Devotional Routes', () => {
  const app = Fastify()
  let userToken: string
  let userId: string
  let branchId: string
  let memberId: string

  beforeAll(async () => {
    // Garantir que o JWT_SECRET está configurado para os testes
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'churchapp-secret-key'
    }

    app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'churchapp-secret-key',
    })

    // Usa o middleware authenticate do projeto que popula request.user corretamente
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

    // Criar User
    const user = await prisma.user.create({
      data: {
        name: 'User Teste',
        email: 'user@test.com',
        password: await bcrypt.hash('password123', 10),
        Subscription: {
          create: {
            planId: plan.id,
            status: 'active',
          },
        },
      },
    })

    userId = user.id

    // Criar Church e Branch
    const church = await prisma.church.create({
      data: {
        name: 'Igreja Teste',
        isActive: true,
        Branch: {
          create: {
            name: 'Sede',
            isMainBranch: true,
          },
        },
      },
      include: {
        Branch: true,
      },
    })

    branchId = church.Branch[0].id

    // Criar Member
    const member = await prisma.member.create({
      data: {
        name: 'Member Teste',
        email: 'member@test.com',
        role: 'ADMINGERAL',
        branchId,
        userId,
        Permission: {
          create: {
            type: 'devotional_manage',
          },
        },
      },
    })

    memberId = member.id

    // Buscar permissões do membro
    const memberWithPermissions = await prisma.member.findUnique({
      where: { id: member.id },
      include: { Permission: true },
    })

    // Criar token para Member com permissões
    userToken = app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'member',
      id: user.id,
      userId: user.id,
      memberId: member.id,
      role: member.role,
      branchId: member.branchId,
      churchId: church.id,
      permissions: memberWithPermissions?.Permission.map(p => p.type) || ['devotional_manage'],
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('POST /devotionals', () => {
    it('deve criar um devocional com sucesso', async () => {
      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Devocional de Teste',
          passage: 'João 3:16',
          content: 'Porque Deus amou o mundo de tal maneira...',
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.title).toBe('Devocional de Teste')
      expect(response.body.passage).toBe('João 3:16')
      expect(response.body.content).toBe('Porque Deus amou o mundo de tal maneira...')
      expect(response.body.authorId).toBe(memberId)
      expect(response.body.branchId).toBe(branchId)
    })

    it('deve criar um devocional sem conteúdo', async () => {
      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Devocional Sem Conteúdo',
          passage: 'Romanos 8:28',
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.title).toBe('Devocional Sem Conteúdo')
      expect(response.body.passage).toBe('Romanos 8:28')
      expect(response.body.content).toBeNull()
    })

    it('deve retornar 400 quando título está vazio', async () => {
      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '',
          passage: 'João 3:16',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('Dados inválidos')
    })

    it('deve retornar 400 quando passage está vazia', async () => {
      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Devocional Teste',
          passage: '',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('Dados inválidos')
    })

    it('deve retornar 400 quando título está faltando', async () => {
      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          passage: 'João 3:16',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('deve retornar 400 quando passage está faltando', async () => {
      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Devocional Teste',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('deve retornar 400 quando usuário não está vinculado a uma filial', async () => {
      // Criar token com role e permissões válidas, mas sem branchId
      // Isso permite que os middlewares passem, mas o controller retorna 400
      const tokenWithoutBranch = app.jwt.sign({
        sub: userId,
        email: 'user@test.com',
        name: 'User Teste',
        type: 'member',
        id: userId,
        userId: userId,
        memberId: memberId,
        role: 'ADMINGERAL',
        branchId: null, // Sem branchId para testar o erro 400
        churchId: null,
        permissions: ['devotional_manage'],
      })

      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${tokenWithoutBranch}`)
        .send({
          title: 'Devocional Teste',
          passage: 'João 3:16',
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Usuário não vinculado a uma filial.')
    })
  })

  describe('GET /devotionals', () => {
    it('deve retornar lista de devocionais', async () => {
      // Criar alguns devocionais primeiro
      await prisma.devotional.createMany({
        data: [
          {
            title: 'Devocional 1',
            passage: 'João 3:16',
            content: 'Conteúdo 1',
            authorId: memberId,
            branchId,
          },
          {
            title: 'Devocional 2',
            passage: 'Romanos 8:28',
            content: 'Conteúdo 2',
            authorId: memberId,
            branchId,
          },
        ],
      })

      const response = await request(app.server)
        .get('/devotionals')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThanOrEqual(2)
      
      // Verificar estrutura do devocional retornado
      const devotional = response.body[0]
      expect(devotional).toHaveProperty('id')
      expect(devotional).toHaveProperty('title')
      expect(devotional).toHaveProperty('passage')
      expect(devotional).toHaveProperty('author')
      expect(devotional).toHaveProperty('likes')
      expect(devotional).toHaveProperty('liked')
    })

    it('deve retornar 400 quando usuário não está vinculado a uma filial', async () => {
      const tokenWithoutBranch = app.jwt.sign({
        sub: userId,
        email: 'user@test.com',
        name: 'User Teste',
        type: 'user',
        id: userId,
        userId: userId,
        memberId: null,
        role: null,
        branchId: null,
        churchId: null,
        permissions: [],
      })

      const response = await request(app.server)
        .get('/devotionals')
        .set('Authorization', `Bearer ${tokenWithoutBranch}`)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Usuário não vinculado a uma filial.')
    })
  })
})

