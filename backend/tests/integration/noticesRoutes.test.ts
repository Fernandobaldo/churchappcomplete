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

describe('Notices Routes', () => {
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

    // Criar membro com permissão members_manage
    const member = await prisma.member.create({
      data: {
        name: 'Test Member',
        email: 'member@example.com',
        branchId: branch.id,
        role: 'ADMINFILIAL',
        userId: user.id,
        Permission: {
          create: { type: 'members_manage' },
        },
      },
      include: { Permission: true },
    })
    memberId = member.id

    // Gerar token
    userToken = app.jwt.sign({
      sub: user.id,
      userId: user.id, // Adicionar userId explicitamente
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

  describe('GET /notices', () => {
    it('deve retornar lista vazia quando não há avisos', async () => {
      const response = await request(app.server)
        .get('/notices')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })

    it('deve retornar avisos da filial do usuário', async () => {
      // Criar aviso
      const notice = await prisma.notice.create({
        data: {
          title: 'Aviso Importante',
          message: 'Este é um aviso de teste',
          branchId: branchId,
          viewedBy: [],
        },
      })

      const response = await request(app.server)
        .get('/notices')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('title', 'Aviso Importante')
      expect(response.body[0]).toHaveProperty('message', 'Este é um aviso de teste')
      expect(response.body[0]).toHaveProperty('read', false)
    })

    it('deve marcar aviso como lido quando usuário está em viewedBy', async () => {
      // Criar aviso já visualizado pelo usuário (usando userId do token)
      const notice = await prisma.notice.create({
        data: {
          title: 'Aviso Lido',
          message: 'Este aviso já foi lido',
          branchId: branchId,
          viewedBy: [userId], // userId do token
        },
      })

      const response = await request(app.server)
        .get('/notices')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      const noticeInResponse = response.body.find((n: any) => n.id === notice.id)
      expect(noticeInResponse).toBeDefined()
      // O controller adiciona o campo 'read' baseado em viewedBy
      // Verifica se o campo read existe e é true
      expect(noticeInResponse).toHaveProperty('read')
      expect(noticeInResponse.read).toBe(true)
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
        .get('/notices')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message', 'Usuário não vinculado a uma filial.')
    })
  })

  describe('POST /notices', () => {
    it('deve criar aviso com sucesso', async () => {
      const noticeData = {
        title: 'Novo Aviso',
        message: 'Mensagem do aviso',
      }

      const response = await request(app.server)
        .post('/notices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(noticeData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Novo Aviso')
      expect(response.body).toHaveProperty('message', 'Mensagem do aviso')
      expect(response.body).toHaveProperty('branchId', branchId)
      expect(response.body).toHaveProperty('viewedBy')
      expect(Array.isArray(response.body.viewedBy)).toBe(true)
    })

    it('deve retornar 400 quando dados inválidos', async () => {
      const noticeData = {
        title: '',
        message: '',
      }

      const response = await request(app.server)
        .post('/notices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(noticeData)

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

      const noticeData = {
        title: 'Aviso',
        message: 'Mensagem',
      }

      const response = await request(app.server)
        .post('/notices')
        .set('Authorization', `Bearer ${tokenWithoutPermission}`)
        .send(noticeData)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
    })
  })

  describe('POST /notices/:id/read', () => {
    it('deve marcar aviso como lido', async () => {
      const notice = await prisma.notice.create({
        data: {
          title: 'Aviso para Ler',
          message: 'Este aviso será marcado como lido',
          branchId: branchId,
          viewedBy: [],
        },
      })

      const response = await request(app.server)
        .post(`/notices/${notice.id}/read`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Aviso marcado como lido')

      // Verificar se foi marcado como lido
      const updatedNotice = await prisma.notice.findUnique({
        where: { id: notice.id },
      })
      expect(updatedNotice?.viewedBy).toContain(userId)
    })

    it('deve retornar 404 quando aviso não existe', async () => {
      const fakeId = 'clx123456789012345678901234'
      const response = await request(app.server)
        .post(`/notices/${fakeId}/read`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 404)
      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('message', 'Aviso não encontrado')
    })

    it('não deve adicionar usuário duplicado em viewedBy', async () => {
      const notice = await prisma.notice.create({
        data: {
          title: 'Aviso Já Lido',
          message: 'Este aviso já foi lido',
          branchId: branchId,
          viewedBy: [userId],
        },
      })

      const response = await request(app.server)
        .post(`/notices/${notice.id}/read`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      // Verificar que não foi adicionado duplicado
      const updatedNotice = await prisma.notice.findUnique({
        where: { id: notice.id },
      })
      const count = updatedNotice?.viewedBy.filter(id => id === userId).length
      expect(count).toBe(1)
    })
  })
})

