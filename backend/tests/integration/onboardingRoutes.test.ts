// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { beforeAll, afterAll, describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { seedTestDatabase } from '../utils/seedTestDatabase'
import { authenticate } from '../../src/middlewares/authenticate'

describe('Onboarding Routes - Fluxo Completo', () => {
  const app = Fastify()
  let testData: Awaited<ReturnType<typeof seedTestDatabase>>
  let userToken: string
  let userId: string

  beforeAll(async () => {
    app.register(fastifyJwt, {
      secret: 'churchapp-secret-key',
    })

    // Usa o middleware authenticate do projeto que popula request.user corretamente
    app.decorate('authenticate', authenticate)

    await registerRoutes(app)
    await app.ready()

    await resetTestDatabase()
    testData = await seedTestDatabase()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Cria um usuário de teste para o onboarding
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        name: 'Onboarding User',
        email: `onboarding-${Date.now()}@test.com`,
        password: hashedPassword,
      },
    })

    userId = user.id

    // Busca plano Free
    const freePlan = await prisma.plan.findFirst({ where: { name: 'free' } })
    if (freePlan) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: 'active',
        },
      })
    }

    // Gera token JWT
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'user' as const,
      role: null,
      branchId: null,
      permissions: [],
    }

    userToken = app.jwt.sign(tokenPayload, { expiresIn: '7d' })
  })

  describe('POST /register - Registro Público', () => {
    it('deve criar usuário e retornar token', async () => {
      const response = await request(app.server)
        .post('/register')
        .send({
          name: 'Novo Usuário',
          email: `newuser-${Date.now()}@test.com`,
          password: 'password123',
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('id')
      expect(response.body.user).toHaveProperty('email')
    })

    it('deve retornar erro se email já existe', async () => {
      const email = `duplicate-${Date.now()}@test.com`

      // Primeira criação
      await request(app.server).post('/register').send({
        name: 'Usuário 1',
        email,
        password: 'password123',
      })

      // Tentativa duplicada
      const response = await request(app.server).post('/register').send({
        name: 'Usuário 2',
        email,
        password: 'password123',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('já cadastrado')
    })
  })

  describe('POST /churches - Criação de Igreja', () => {
    it('deve criar igreja com filial principal', async () => {
      const response = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja de Teste',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('church')
      expect(response.body.church).toHaveProperty('id')
      expect(response.body.church.name).toBe('Igreja de Teste')
      expect(response.body).toHaveProperty('branch')
      expect(response.body.branch.isMainBranch).toBe(true)
    })

    it('deve criar membro administrador ao criar igreja', async () => {
      const response = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja com Admin',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('member')
      expect(response.body.member.role).toBe('ADMINGERAL')
    })

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server).post('/churches').send({
        name: 'Igreja Sem Auth',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /churches - Buscar Igrejas', () => {
    it('deve retornar array vazio quando usuário não tem branchId (sem igreja configurada)', async () => {
      const response = await request(app.server)
        .get('/churches')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })

    it('deve retornar apenas a igreja do usuário quando tem branchId', async () => {
      // Primeiro cria uma igreja para o usuário
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja do Usuário',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(churchResponse.status).toBe(201)
      const memberToken = churchResponse.body.token

      // Agora busca as igrejas com o token que tem branchId
      const response = await request(app.server)
        .get('/churches')
        .set('Authorization', `Bearer ${memberToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBe(1)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0].name).toBe('Igreja do Usuário')
    })

    it('não deve retornar igrejas de outros usuários', async () => {
      // Cria uma segunda igreja com outro usuário
      const hashedPassword2 = await bcrypt.hash('password123', 10)
      const user2 = await prisma.user.create({
        data: {
          name: 'Outro Usuário',
          email: `otheruser-${Date.now()}@test.com`,
          password: hashedPassword2,
        },
      })

      const freePlan = await prisma.plan.findFirst({ where: { name: 'free' } })
      if (freePlan) {
        await prisma.subscription.create({
          data: {
            userId: user2.id,
            planId: freePlan.id,
            status: 'active',
          },
        })
      }

      const tokenPayload2 = {
        sub: user2.id,
        email: user2.email,
        name: user2.name,
        type: 'user' as const,
        role: null,
        branchId: null,
        permissions: [],
      }

      const userToken2 = app.jwt.sign(tokenPayload2, { expiresIn: '7d' })

      // Cria igreja para o segundo usuário
      const churchResponse2 = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          name: 'Igreja do Outro Usuário',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(churchResponse2.status).toBe(201)
      const memberToken2 = churchResponse2.body.token

      // Cria igreja para o primeiro usuário
      const churchResponse1 = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja do Primeiro Usuário',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(churchResponse1.status).toBe(201)
      const memberToken1 = churchResponse1.body.token

      // Busca igrejas com token do primeiro usuário
      const response = await request(app.server)
        .get('/churches')
        .set('Authorization', `Bearer ${memberToken1}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBe(1)
      expect(response.body[0].name).toBe('Igreja do Primeiro Usuário')
      // Não deve conter a igreja do outro usuário
      expect(response.body.find((c: any) => c.name === 'Igreja do Outro Usuário')).toBeUndefined()
    })
  })

  describe('POST /branches - Criação de Filiais', () => {
    let churchId: string
    let memberToken: string

    beforeEach(async () => {
      // Cria igreja antes de cada teste
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja para Filiais',
          withBranch: true,
          branchName: 'Sede',
        })

      churchId = churchResponse.body.church.id
      
      // Usa o token retornado da criação da igreja (que tem branchId e role)
      if (churchResponse.body.token) {
        memberToken = churchResponse.body.token
        
        // Garante que o userId do token tenha subscription
        // O token usa dbUser.id (userId do token original), não member.userId
        // Precisamos decodificar o token para pegar o userId correto
        const decoded = app.jwt.decode(memberToken) as any
        const tokenUserId = decoded?.sub || decoded?.userId || userId
        
        // Busca o plano (pode ser 'free' ou 'Free Plan')
        const freePlan = await prisma.plan.findFirst({ 
          where: { 
            OR: [
              { name: 'free' },
              { name: 'Free Plan' },
              { name: { contains: 'free', mode: 'insensitive' } }
            ]
          } 
        })
        
        if (freePlan) {
          // Verifica se já existe subscription para o userId do token
          const existingSubscription = await prisma.subscription.findFirst({
            where: { userId: tokenUserId, status: 'active' }
          })
          if (!existingSubscription) {
            await prisma.subscription.create({
              data: {
                userId: tokenUserId,
                planId: freePlan.id,
                status: 'active',
              },
            })
          }
        }
      } else {
        // Se não retornou token, cria um manualmente
        const member = churchResponse.body.member
        const updatedTokenPayload = {
          sub: userId,
          email: 'onboarding@test.com',
          name: 'Onboarding User',
          type: 'member' as const,
          role: member.role,
          branchId: member.branchId,
          permissions: ['events_manage', 'contributions_manage', 'members_manage'],
        }
        memberToken = app.jwt.sign(updatedTokenPayload, { expiresIn: '7d' })
      }
    })

    it('deve criar filial com sucesso', async () => {
      // Aumenta o limite de filiais do plano para permitir criar uma filial adicional
      // (já existe 1 filial principal criada com a igreja)
      const plan = await prisma.plan.findFirst({ 
        where: { 
          OR: [
            { name: 'free' },
            { name: 'Free Plan' },
            { name: { contains: 'free', mode: 'insensitive' } }
          ]
        } 
      })
      
      if (plan) {
        // Salva o limite original
        const originalLimit = plan.maxBranches
        
        // Aumenta o limite temporariamente para o teste
        await prisma.plan.update({
          where: { id: plan.id },
          data: { maxBranches: 2 },
        })
        
        try {
          const response = await request(app.server)
            .post('/branches')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({
              name: 'Filial Centro',
              churchId,
            })

          expect(response.status).toBe(201)
          expect(response.body).toHaveProperty('id')
          expect(response.body.name).toBe('Filial Centro')
          expect(response.body.churchId).toBe(churchId)
          
          // Restaura o limite original
          await prisma.plan.update({
            where: { id: plan.id },
            data: { maxBranches: originalLimit },
          })
        } catch (error) {
          // Restaura o limite original mesmo em caso de erro
          await prisma.plan.update({
            where: { id: plan.id },
            data: { maxBranches: originalLimit },
          })
          throw error
        }
      } else {
        // Se não encontrar o plano, o teste deve falhar
        throw new Error('Plano não encontrado para o teste')
      }
    })

    it('deve retornar erro se churchId não existe', async () => {
      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Filial Inválida',
          churchId: 'invalid-church-id',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('Fluxo Completo de Onboarding', () => {
    it('deve completar todo o fluxo: registro → igreja', async () => {
      // 1. Registro
      const registerResponse = await request(app.server)
        .post('/register')
        .send({
          name: 'Usuário Completo',
          email: `complete-${Date.now()}@test.com`,
          password: 'password123',
        })

      expect(registerResponse.status).toBe(201)
      const registerToken = registerResponse.body.token

      // 2. Criar Igreja
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${registerToken}`)
        .send({
          name: 'Igreja Completa',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(churchResponse.status).toBe(201)

      // Verifica que tudo foi criado
      expect(churchResponse.body.church).toBeDefined()
      expect(churchResponse.body.branch).toBeDefined()
      expect(churchResponse.body.member).toBeDefined()
    })
  })
})

