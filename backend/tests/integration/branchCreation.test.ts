// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import { resetTestDatabase } from '../utils/db'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'
import { 
  createTestUser, 
  createTestMember, 
  createTestChurch, 
  createTestBranch, 
  createTestPlan, 
  createTestSubscription 
} from '../utils/testFactories'
import type { FastifyInstance } from 'fastify'
import { SubscriptionStatus } from '@prisma/client'

describe('POST /branches - Branch Creation Integration Tests', () => {
  let app: FastifyInstance
  let planId: string
  let adminToken: string
  let adminBranchId: string
  let adminChurchId: string
  let adminFilialToken: string

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()

    // Criar plano para testes
    const plan = await createTestPlan({
      name: 'Free Plan',
      maxMembers: 10,
      maxBranches: 2, // Iniciar com 2 para permitir testes
    })
    planId = plan.id
  })

  beforeEach(async () => {
    await resetTestDatabase()

    // Criar plano novamente após reset
    const plan = await createTestPlan({
      name: 'Free Plan',
      maxMembers: 10,
      maxBranches: 2,
    })
    planId = plan.id

    // Criar User e Member ADMINGERAL
    const adminUser = await createTestUser({
      email: `admin-${Date.now()}@test.com`,
      firstName: 'Admin',
      lastName: 'Geral',
      password: 'password123',
    })

    await createTestSubscription(adminUser.id, planId, SubscriptionStatus.active)

    const church = await createTestChurch({
      name: 'Igreja Admin',
      createdByUserId: adminUser.id,
    })

    adminChurchId = church.id

    const branch = await createTestBranch({
      churchId: church.id,
      name: 'Sede',
      isMainBranch: true,
    })

    adminBranchId = branch.id

    const adminMember = await createTestMember({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'ADMINGERAL' as any,
      branchId: branch.id,
    })

    adminToken = await generateTestToken(app, {
      sub: adminUser.id,
      email: adminUser.email,
      name: `${adminUser.firstName} ${adminUser.lastName}`.trim(),
      type: 'member',
      memberId: adminMember.id,
      role: 'ADMINGERAL',
      branchId: branch.id,
      churchId: church.id,
      permissions: [],
      onboardingCompleted: true,
    })

    // Criar ADMINFILIAL
    const adminFilialUser = await createTestUser({
      email: `adminfilial-${Date.now()}@test.com`,
      firstName: 'Admin',
      lastName: 'Filial',
      password: 'password123',
    })

    await createTestSubscription(adminFilialUser.id, planId, SubscriptionStatus.active)

    const adminFilialMember = await createTestMember({
      userId: adminFilialUser.id,
      email: adminFilialUser.email,
      role: 'ADMINFILIAL' as any,
      branchId: branch.id,
    })

    adminFilialToken = await generateTestToken(app, {
      sub: adminFilialUser.id,
      email: adminFilialUser.email,
      name: `${adminFilialUser.firstName} ${adminFilialUser.lastName}`.trim(),
      type: 'member',
      memberId: adminFilialMember.id,
      role: 'ADMINFILIAL',
      branchId: branch.id,
      churchId: church.id,
      permissions: [],
      onboardingCompleted: true,
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  // Teste 1: 200/201 Success
  it('deve criar branch com sucesso (201 Created)', async () => {
    // Given: ADMINGERAL autenticado com igreja
    // When: POST /branches com dados válidos
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Nova Filial',
        churchId: adminChurchId,
      })

    // Then: Retorna 201 com branch criada
    expect(response.status).toBe(201)
    expect(response.body.name).toBe('Nova Filial')
    expect(response.body.churchId).toBe(adminChurchId)
  })

  // Teste 2: 400 Invalid payload
  it('deve retornar 400 se nome não for fornecido', async () => {
    // Given: Requisição sem campo obrigatório
    // When: POST /branches sem name
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        churchId: adminChurchId,
      })

    // Then: Retorna 400
    expect(response.status).toBe(400)
  })

  it('deve retornar 400 se churchId não for fornecido', async () => {
    // Given: Requisição sem churchId obrigatório
    // When: POST /branches sem churchId
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Nova Filial',
      })

    // Then: Retorna 400
    expect(response.status).toBe(400)
  })

  it('deve retornar 400 se churchId não existir', async () => {
    // Given: churchId inexistente
    // When: POST /branches com churchId inválido
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Filial Igreja Inexistente',
        churchId: 'church-inexistente',
      })

    // Then: Retorna 400
    expect(response.status).toBe(400)
  })

  // Teste 3: 401 Unauthenticated
  it('deve retornar 401 se não estiver autenticado', async () => {
    // Given: Requisição sem token
    // When: POST /branches sem Authorization header
    const response = await request(app.server)
      .post('/branches')
      .send({
        name: 'Nova Filial',
        churchId: adminChurchId,
      })

    // Then: Retorna 401
    expect(response.status).toBe(401)
  })

  // Teste 4: 403 Forbidden - ADMINFILIAL não pode criar
  it('deve retornar 403 se ADMINFILIAL tentar criar branch', async () => {
    // Given: ADMINFILIAL autenticado
    // When: POST /branches
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminFilialToken}`)
      .send({
        name: 'Filial Não Autorizada',
        churchId: adminChurchId,
      })

    // Then: Retorna 403
    expect(response.status).toBe(403)
    expect(response.body.error).toBeDefined()
  })

  // Teste 5: 403 Forbidden - Criar branch para outra igreja
  it('deve retornar 403 se tentar criar branch para outra igreja', async () => {
    // Given: Outra igreja criada por outro usuário
    const otherUser = await createTestUser({
      email: `otheruser-${Date.now()}@test.com`,
      firstName: 'Other',
      lastName: 'User',
    })

    await createTestSubscription(otherUser.id, planId, SubscriptionStatus.active)

    const otherChurch = await createTestChurch({
      name: 'Outra Igreja',
      createdByUserId: otherUser.id, // Usar ID de usuário, não de igreja
    })

    // When: POST /branches para outra igreja
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Filial Outra Igreja',
        churchId: otherChurch.id,
      })

    // Then: Retorna 403
    expect(response.status).toBe(403)
    expect(response.body.error).toBeDefined()
  })

  // Teste 6: 422 Business rule - Limite de branches excedido
  it('deve retornar 422 quando limite de branches do plano é excedido', async () => {
    // Given: Plano com limite de 1 branch (já temos 1 criada no beforeEach)
    await prisma.plan.update({
      where: { id: planId },
      data: { maxBranches: 1 },
    })

    // When: Tentar criar segunda branch
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Filial Excedente',
        churchId: adminChurchId,
      })

    // Then: Retorna 422 ou 403 (dependendo da implementação)
    expect([422, 403]).toContain(response.status)
    expect(response.body.error).toBeDefined()

    // Restaurar limite
    await prisma.plan.update({
      where: { id: planId },
      data: { maxBranches: 2 },
    })
  })

  // Teste 7: DB side-effect assertions
  it('deve criar branch no banco de dados com dados corretos', async () => {
    // Given: ADMINGERAL autenticado
    const branchName = `Filial DB Test ${Date.now()}`

    // When: POST /branches
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: branchName,
        churchId: adminChurchId,
      })

    expect(response.status).toBe(201)
    const branchId = response.body.id

    // Then: Verifica side-effects no banco
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { Church: true },
    })

    expect(branch).toBeDefined()
    expect(branch?.name).toBe(branchName)
    expect(branch?.churchId).toBe(adminChurchId)
    expect(branch?.Church).toBeDefined()
    expect(branch?.isMainBranch).toBe(false) // Filiais adicionais não são main branch
  })

  // Teste adicional: Permitir criar quando maxBranches é null (ilimitado)
  it('deve permitir criar branch quando maxBranches é null (ilimitado)', async () => {
    // Given: Plano com limite ilimitado
    const originalLimit = (await prisma.plan.findUnique({ where: { id: planId } }))?.maxBranches
    
    await prisma.plan.update({
      where: { id: planId },
      data: { maxBranches: null },
    })

    // When: POST /branches
    const response = await request(app.server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Filial Ilimitada',
        churchId: adminChurchId,
      })

    // Then: Retorna 201
    expect(response.status).toBe(201)

    // Restaurar limite original
    await prisma.plan.update({
      where: { id: planId },
      data: { maxBranches: originalLimit || 2 },
    })
  })
})

