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
import { logTestResponse } from '../utils/testResponseHelper'

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

      logTestResponse(response, 201)
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

      logTestResponse(response, 201)
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

      logTestResponse(response, 400)
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

      logTestResponse(response, 400)
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

      logTestResponse(response, 400)
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

      logTestResponse(response, 400)
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

      logTestResponse(response, 400)
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

      logTestResponse(response, 200)
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

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Usuário não vinculado a uma filial.')
    })
  })

  describe('PUT /devotionals/:id', () => {
    it('deve atualizar devocional com sucesso', async () => {
      // Criar devocional para editar
      const devotional = await prisma.devotional.create({
        data: {
          title: 'Devocional Original',
          passage: 'João 3:16',
          content: 'Conteúdo original',
          authorId: memberId,
          branchId,
        },
      })
      const devotionalId = devotional.id

      const response = await request(app.server)
        .put(`/devotionals/${devotionalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Devocional Atualizado',
          passage: 'Romanos 8:28',
          content: 'Conteúdo atualizado',
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', devotionalId)
      expect(response.body).toHaveProperty('title', 'Devocional Atualizado')
      expect(response.body).toHaveProperty('passage', 'Romanos 8:28')
      expect(response.body).toHaveProperty('content', 'Conteúdo atualizado')
    })

    it('deve atualizar apenas título', async () => {
      // Criar devocional para editar
      const devotional = await prisma.devotional.create({
        data: {
          title: 'Devocional Original',
          passage: 'João 3:16',
          content: 'Conteúdo original',
          authorId: memberId,
          branchId,
        },
      })
      const devotionalId = devotional.id

      const response = await request(app.server)
        .put(`/devotionals/${devotionalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Apenas Título Atualizado',
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('title', 'Apenas Título Atualizado')
      expect(response.body).toHaveProperty('passage', 'João 3:16') // Mantém original
    })

    it('deve retornar 404 quando devocional não existe', async () => {
      const fakeId = 'clx123456789012345678901234'
      const response = await request(app.server)
        .put(`/devotionals/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Título',
        })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Devocional não encontrado.')
    })

    it('deve retornar 403 quando usuário não é o autor e não tem permissão', async () => {
      // Criar devocional para editar
      const devotional = await prisma.devotional.create({
        data: {
          title: 'Devocional Original',
          passage: 'João 3:16',
          content: 'Conteúdo original',
          authorId: memberId,
          branchId,
        },
      })
      const devotionalId = devotional.id
      // Criar outro membro sem permissão
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@test.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const otherMember = await prisma.member.create({
        data: {
          name: 'Other Member',
          email: 'othermember@test.com',
          branchId,
          role: 'MEMBER',
          userId: otherUser.id,
        },
      })

      const otherToken = app.jwt.sign({
        sub: otherUser.id,
        email: otherUser.email,
        name: otherUser.name,
        type: 'member',
        id: otherUser.id,
        userId: otherUser.id,
        memberId: otherMember.id,
        role: otherMember.role,
        branchId: otherMember.branchId,
        churchId: null,
        permissions: [],
      })

      const response = await request(app.server)
        .put(`/devotionals/${devotionalId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Tentativa de Edição',
        })

      expect(response.status).toBe(403)
      // O middleware pode retornar "Acesso negado" ou a mensagem do controller
      expect(response.body.message || response.body.error).toBeDefined()
    })

    it('deve permitir edição quando usuário tem permissão devotional_manage', async () => {
      // Criar devocional para editar
      const devotional = await prisma.devotional.create({
        data: {
          title: 'Devocional Original',
          passage: 'João 3:16',
          content: 'Conteúdo original',
          authorId: memberId,
          branchId,
        },
      })
      const devotionalId = devotional.id

      // Criar membro com permissão mas não é o autor
      const otherUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@test.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const adminMember = await prisma.member.create({
        data: {
          name: 'Admin Member',
          email: 'adminmember@test.com',
          branchId,
          role: 'ADMINFILIAL',
          userId: otherUser.id,
          Permission: {
            create: { type: 'devotional_manage' },
          },
        },
        include: { Permission: true },
      })

      const adminToken = app.jwt.sign({
        sub: otherUser.id,
        email: otherUser.email,
        name: otherUser.name,
        type: 'member',
        id: otherUser.id,
        userId: otherUser.id,
        memberId: adminMember.id,
        role: adminMember.role,
        branchId: adminMember.branchId,
        churchId: null,
        permissions: adminMember.Permission.map(p => p.type),
      })

      const response = await request(app.server)
        .put(`/devotionals/${devotionalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Editado por Admin',
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('title', 'Editado por Admin')
    })
  })

  describe('DELETE /devotionals/:id', () => {
    it('deve deletar devocional com sucesso', async () => {
      // Criar devocional para deletar
      const devotional = await prisma.devotional.create({
        data: {
          title: 'Devocional para Deletar',
          passage: 'João 3:16',
          content: 'Conteúdo',
          authorId: memberId,
          branchId,
        },
      })
      const devotionalId = devotional.id
      const response = await request(app.server)
        .delete(`/devotionals/${devotionalId}`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Devocional deletado com sucesso')

      // Verificar se foi deletado
      const deleted = await prisma.devotional.findUnique({
        where: { id: devotionalId },
      })
      expect(deleted).toBeNull()
    })

    it('deve deletar likes associados ao devocional', async () => {
      // Criar devocional para deletar
      const devotional = await prisma.devotional.create({
        data: {
          title: 'Devocional para Deletar',
          passage: 'João 3:16',
          content: 'Conteúdo',
          authorId: memberId,
          branchId,
        },
      })
      const devotionalId = devotional.id

      // Criar like
      await prisma.devotionalLike.create({
        data: {
          devotionalId,
          userId: memberId,
        },
      })

      const response = await request(app.server)
        .delete(`/devotionals/${devotionalId}`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      // Verificar se likes foram deletados
      const likes = await prisma.devotionalLike.findMany({
        where: { devotionalId },
      })
      expect(likes.length).toBe(0)
    })

    it('deve retornar 404 quando devocional não existe', async () => {
      const fakeId = 'clx123456789012345678901234'
      const response = await request(app.server)
        .delete(`/devotionals/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Devocional não encontrado.')
    })

    it('deve retornar 403 quando usuário não é o autor e não tem permissão', async () => {
      // Criar devocional para deletar
      const devotional = await prisma.devotional.create({
        data: {
          title: 'Devocional para Deletar',
          passage: 'João 3:16',
          content: 'Conteúdo',
          authorId: memberId,
          branchId,
        },
      })
      const devotionalId = devotional.id
      // Criar outro membro sem permissão
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other2@test.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const otherMember = await prisma.member.create({
        data: {
          name: 'Other Member',
          email: 'othermember2@test.com',
          branchId,
          role: 'MEMBER',
          userId: otherUser.id,
        },
      })

      const otherToken = app.jwt.sign({
        sub: otherUser.id,
        email: otherUser.email,
        name: otherUser.name,
        type: 'member',
        id: otherUser.id,
        userId: otherUser.id,
        memberId: otherMember.id,
        role: otherMember.role,
        branchId: otherMember.branchId,
        churchId: null,
        permissions: [],
      })

      const response = await request(app.server)
        .delete(`/devotionals/${devotionalId}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(response.status).toBe(403)
      // O middleware pode retornar "Acesso negado" ou a mensagem do controller
      expect(response.body.message || response.body.error).toBeDefined()
    })
  })
})

