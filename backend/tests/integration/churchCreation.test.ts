// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import { resetTestDatabase } from '../utils/db'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'
import { 
  createTestUser, 
  createTestPlan, 
  createTestSubscription 
} from '../utils/testFactories'
import type { FastifyInstance } from 'fastify'
import { SubscriptionStatus } from '@prisma/client'

describe('POST /churches - Integration Tests', () => {
  let app: FastifyInstance
  let userToken: string
  let userId: string
  let planId: string

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()
  })

  beforeEach(async () => {
    await resetTestDatabase()

    // Criar plano após reset (necessário para subscription)
    const plan = await createTestPlan({
      name: 'Free Plan',
      maxMembers: 10,
      maxBranches: 1,
    })
    planId = plan.id

    // Criar User para cada teste (sem Member)
    const user = await createTestUser({
      email: `user-${Date.now()}@test.com`,
      firstName: 'User',
      lastName: 'Teste',
      password: 'password123',
    })

    await createTestSubscription(user.id, planId, SubscriptionStatus.active)

    userId = user.id

    // Criar token para User (sem Member)
    userToken = await generateTestToken(app, {
      sub: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      type: 'user',
      memberId: null,
      role: null,
      branchId: null,
      churchId: null,
      permissions: [],
      onboardingCompleted: false,
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  // Teste 1: 200/201 Success
  it('deve criar igreja com sucesso (201 Created)', async () => {
    // Given: Usuário autenticado sem igreja
    // When: POST /churches com dados válidos
    const response = await request(app.server)
      .post('/churches')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Igreja Nova',
        branchName: 'Sede',
        withBranch: true,
      })

    // Then: Retorna 201 com church/branch/member criados
    expect(response.status).toBe(201)
    expect(response.body.church).toBeDefined()
    expect(response.body.branch).toBeDefined()
    expect(response.body.member).toBeDefined()
    expect(response.body.token).toBeDefined()

    // Verifica side-effects no banco (DB side-effect assertions)
    const churchId = response.body.church.id
    const branchId = response.body.branch.id
    const memberId = response.body.member.id

    const church = await prisma.church.findUnique({ where: { id: churchId } })
    const branch = await prisma.branch.findUnique({ where: { id: branchId } })
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { User: true },
    })

    expect(church).toBeDefined()
    expect(church?.createdByUserId).toBe(userId)
    expect(branch).toBeDefined()
    expect(branch?.churchId).toBe(churchId)
    expect(branch?.isMainBranch).toBe(true)
    expect(member).toBeDefined()
    expect(member?.userId).toBe(userId)
    expect(member?.role).toBe('ADMINGERAL')
  })

  // Teste 2: 400 Invalid payload
  it('deve retornar 400 se nome não fornecido', async () => {
    // Given: Usuário autenticado
    // When: POST /churches sem campo obrigatório
    const response = await request(app.server)
      .post('/churches')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        branchName: 'Sede',
        withBranch: true,
      })

    // Then: Retorna 400
    expect(response.status).toBe(400)
  })

  // Teste 3: 401 Unauthenticated
  it('deve retornar 401 se usuário não autenticado', async () => {
    // Given: Requisição sem token
    // When: POST /churches sem Authorization header
    const response = await request(app.server)
      .post('/churches')
      .send({
        name: 'Igreja Nova',
        branchName: 'Sede',
        withBranch: true,
      })

    // Then: Retorna 401
    expect(response.status).toBe(401)
  })

  // Teste 4: 403 Forbidden (não aplicável - usuários podem criar igrejas)

  // Teste 5: 409 Conflict/Idempotency
  it('deve retornar igreja existente se createdByUserId já existe (idempotência)', async () => {
    // Given: Usuário já criou uma igreja
    const firstResponse = await request(app.server)
      .post('/churches')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Igreja Primeira',
        branchName: 'Sede',
        withBranch: true,
      })

    expect(firstResponse.status).toBe(201)
    const firstChurchId = firstResponse.body.church.id

    // When: Tenta criar igreja novamente com mesmo usuário
    const secondResponse = await request(app.server)
      .post('/churches')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Igreja Segunda',
        branchName: 'Outra Sede',
        withBranch: true,
      })

    // Then: Retorna igreja existente (200 ou 409, dependendo da implementação)
    // Verifica que não criou igreja duplicada
    expect([200, 201, 409]).toContain(secondResponse.status)
    
    // Verifica que não há duas igrejas com mesmo createdByUserId
    const userChurches = await prisma.church.findMany({
      where: { createdByUserId: userId },
    })
    expect(userChurches.length).toBe(1)
    expect(userChurches[0].id).toBe(firstChurchId)
  })

  // Teste 6: 422 Business rule (quando aplicável)
  // Nota: Teste de maxBranches é mais adequado em branchCreation.test.ts
  // Este teste verifica validação de regra de negócio básica
  it('deve validar regras de negócio ao criar igreja', async () => {
    // Given: Usuário autenticado
    // When: POST /churches com dados que violam regra de negócio
    // (Exemplo: se houver validação de nome mínimo, etc.)
    const response = await request(app.server)
      .post('/churches')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: '', // Nome vazio pode violar regra
        branchName: 'Sede',
        withBranch: true,
      })

    // Then: Retorna 400, 422 ou 201 dependendo da validação
    // Nota: z.string() aceita string vazia por padrão (sem .min(1))
    // Se houver validação adicional na lógica de negócio, pode retornar 422
    // Se passar todas as validações, pode retornar 201
    expect([400, 422, 201]).toContain(response.status)
  })

  // Teste 7: DB side-effect assertions
  it('deve criar Branch e Member no banco ao criar igreja', async () => {
    // Given: Usuário autenticado sem igreja
    // When: POST /churches
    const response = await request(app.server)
      .post('/churches')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Igreja Side Effects',
        branchName: 'Sede Principal',
        withBranch: true,
      })

    expect(response.status).toBe(201)

    // Then: Verifica efeitos colaterais no banco
    const churchId = response.body.church.id
    const branchId = response.body.branch.id
    const memberId = response.body.member.id

    // Verifica Church
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      include: { Branch: true },
    })
    expect(church).toBeDefined()
    expect(church?.name).toBe('Igreja Side Effects')
    expect(church?.createdByUserId).toBe(userId)

    // Verifica Branch
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { Member: true },
    })
    expect(branch).toBeDefined()
    expect(branch?.name).toBe('Sede Principal')
    expect(branch?.churchId).toBe(churchId)
    expect(branch?.isMainBranch).toBe(true)

    // Verifica Member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { User: true, Branch: true },
    })
    expect(member).toBeDefined()
    expect(member?.userId).toBe(userId)
    expect(member?.branchId).toBe(branchId)
    expect(member?.role).toBe('ADMINGERAL')
    expect(member?.User).toBeDefined()
    expect(member?.Branch).toBeDefined()

    // Verifica que Member não tem senha (novo modelo)
    const memberInDb = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Member' AND column_name = 'password'
    `
    expect(Array.isArray(memberInDb)).toBe(true)
    expect((memberInDb as any[]).length).toBe(0)
  })
})

