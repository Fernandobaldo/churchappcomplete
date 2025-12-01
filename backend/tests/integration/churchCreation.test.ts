// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
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

describe('Church Creation - Novo Modelo User + Member', () => {
  const app = Fastify()
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

    // Criar User (sem Member ainda)
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

    // Criar token para User (sem Member)
    userToken = app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'user',
      memberId: null,
      role: null,
      branchId: null,
      churchId: null,
      permissions: [],
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  it('deve criar igreja e Member associado ao User (Member sem senha)', async () => {
    const response = await request(app.server)
      .post('/churches')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Igreja Nova',
        branchName: 'Sede',
        withBranch: true,
      })

    logTestResponse(response, 201)
    expect(response.status).toBe(201)
    expect(response.body.church).toBeDefined()
    expect(response.body.branch).toBeDefined()
    expect(response.body.member).toBeDefined()
    expect(response.body.token).toBeDefined() // Token atualizado com contexto de Member

    const churchId = response.body.church.id
    const branchId = response.body.branch.id
    const memberId = response.body.member.id

    // Verifica que Member foi criado
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { User: true },
    })

    expect(member).toBeDefined()
    expect(member?.email).toBe('user@test.com')
    expect(member?.userId).toBe(userId)
    expect(member?.User).toBeDefined()
    expect(member?.User?.email).toBe('user@test.com')

    // NOVO MODELO: Verifica que Member não tem senha no banco
    const memberInDb = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Member' AND column_name = 'password'
    `
    expect(Array.isArray(memberInDb)).toBe(true)
    expect((memberInDb as any[]).length).toBe(0) // Coluna password não existe mais

    // Verifica que o token retornado contém contexto de Member
    const decoded = app.jwt.decode(response.body.token) as any
    expect(decoded.memberId).toBe(memberId)
    expect(decoded.role).toBe('ADMINGERAL')
    expect(decoded.branchId).toBe(branchId)
    expect(decoded.churchId).toBe(churchId)
    expect(decoded.type).toBe('member')
  })

  it('deve fazer login após criar igreja usando senha do User', async () => {
    // Primeiro cria igreja
    const churchResponse = await request(app.server)
      .post('/churches')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Igreja Login Test',
        branchName: 'Sede',
        withBranch: true,
      })

    expect(churchResponse.status).toBe(201)

    // Agora faz login usando email do User (que é o mesmo do Member)
    const loginResponse = await request(app.server)
      .post('/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123', // Senha do User
      })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.type).toBe('member') // Deve retornar como member
    expect(loginResponse.body.user.memberId).toBeDefined()
    expect(loginResponse.body.user.role).toBe('ADMINGERAL')
    expect(loginResponse.body.user.branchId).toBeDefined()
  })
})

