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

describe('POST /register - Member Registration Integration Tests', () => {
  let app: FastifyInstance
  let planId: string
  let adminToken: string
  let adminBranchId: string
  let adminUserId: string
  let adminFilialToken: string
  let adminFilialBranchId: string

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

    const branch = await createTestBranch({
      churchId: church.id,
      name: 'Sede',
      isMainBranch: true,
    })

    adminBranchId = branch.id
    adminUserId = adminUser.id

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

    adminFilialBranchId = branch.id

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
  it('deve criar membro com sucesso (201 Created)', async () => {
    // Given: ADMINGERAL autenticado
    // When: POST /register com dados válidos
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Novo Membro',
        email: `novo-${Date.now()}@test.com`,
        password: 'password123',
        branchId: adminBranchId,
        role: 'MEMBER',
      })

    // Then: Retorna 201 com member criado
    expect(response.status).toBe(201)
    expect(response.body.email).toBeDefined()
    expect(response.body.role).toBe('MEMBER')
  })

  // Teste 2: 400 Invalid payload
  it('deve retornar 400 se branchId não for fornecido', async () => {
    // Given: Requisição sem branchId obrigatório
    // When: POST /register sem branchId
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Membro Sem Branch',
        email: `sembranch-${Date.now()}@test.com`,
        password: 'password123',
      })

    // Then: Retorna 400
    expect(response.status).toBe(400)
  })

  it('deve retornar 400 se campos obrigatórios estiverem ausentes', async () => {
    // Given: Requisição sem campos obrigatórios
    // When: POST /register sem name/email/password
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branchId: adminBranchId,
      })

    // Then: Retorna 400
    expect(response.status).toBe(400)
  })

  it('deve retornar 400 se branch não existir', async () => {
    // Given: branchId inexistente
    // When: POST /register com branchId inválido
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Membro Branch Inexistente',
        email: `branchinexistente-${Date.now()}@test.com`,
        password: 'password123',
        branchId: 'branch-inexistente',
      })

    // Then: Retorna 400
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  // Teste 3: 401 Unauthenticated
  it('deve retornar 401 se não estiver autenticado', async () => {
    // Given: Requisição sem token
    // When: POST /register sem Authorization header
    const response = await request(app.server)
      .post('/register')
      .send({
        name: 'Novo Membro',
        email: `novo-${Date.now()}@test.com`,
        password: 'password123',
        branchId: adminBranchId,
      })

    // Then: Retorna 401
    expect(response.status).toBe(401)
  })

  // Teste 4: 403 Forbidden - ADMINFILIAL tentar criar em outra filial
  it('deve retornar 403 se ADMINFILIAL tentar criar membro em outra filial', async () => {
    // Given: ADMINFILIAL autenticado e outra filial criada
    const church = await prisma.church.findFirst()
    if (!church) throw new Error('Igreja não encontrada')

    const otherBranch = await createTestBranch({
      churchId: church.id,
      name: 'Outra Filial',
    })

    // When: POST /register tentando criar em outra filial
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminFilialToken}`)
      .send({
        name: 'Membro Outra Filial',
        email: `outro-${Date.now()}@test.com`,
        password: 'password123',
        branchId: otherBranch.id,
      })

    // Then: Retorna 403
    expect(response.status).toBe(403)
    expect(response.body.error).toBeDefined()
  })

  // Teste 5: 403 Forbidden - Tentar criar ADMINGERAL
  it('deve retornar 403 se tentar criar ADMINGERAL (apenas sistema pode)', async () => {
    // Given: ADMINGERAL autenticado
    // When: POST /register tentando criar ADMINGERAL
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Tentativa Admin Geral',
        email: `tentativa-${Date.now()}@test.com`,
        password: 'password123',
        branchId: adminBranchId,
        role: 'ADMINGERAL',
      })

    // Then: Retorna 403
    expect(response.status).toBe(403)
    expect(response.body.error).toContain('Apenas o sistema pode criar')
  })

  // Teste 6: 422 Business rule - Limite de membros excedido
  it('deve retornar 422 quando limite de membros do plano é excedido', async () => {
    // Given: Plano com limite de membros e membros criados até o limite
    const church = await prisma.church.findFirst()
    if (!church) throw new Error('Igreja não encontrada')

    // Contar membros existentes
    const existingBranches = await prisma.branch.findMany({
      where: { churchId: church.id },
      include: { _count: { select: { Member: true } } },
    })
    const existingMembersCount = existingBranches.reduce(
      (sum, b) => sum + b._count.Member,
      0
    )

    // Atualizar plano para ter limite igual ao número atual + 1
    const newLimit = existingMembersCount + 1
    await prisma.plan.update({
      where: { id: planId },
      data: { maxMembers: newLimit },
    })

    // Criar um membro para atingir o limite
    const memberUser = await createTestUser({
      email: `membro1-${Date.now()}@test.com`,
      firstName: 'Membro',
      lastName: 'Teste',
    })

    await createTestMember({
      userId: memberUser.id,
      email: memberUser.email,
      role: 'MEMBER' as any,
      branchId: adminBranchId,
    })

    // When: Tentar criar mais um membro (excede limite)
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Membro Excedente',
        email: `excedente-${Date.now()}@test.com`,
        password: 'password123',
        branchId: adminBranchId,
      })

    // Then: Retorna 422 ou 403 (dependendo da implementação)
    expect([422, 403]).toContain(response.status)
    expect(response.body.error).toBeDefined()

    // Restaurar limite original
    await prisma.plan.update({
      where: { id: planId },
      data: { maxMembers: 10 },
    })
  })

  // Teste 7: DB side-effect assertions
  it('deve criar User e Member no banco ao criar membro', async () => {
    // Given: ADMINGERAL autenticado
    const memberEmail = `member-db-${Date.now()}@test.com`

    // When: POST /register
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Membro DB Test',
        email: memberEmail,
        password: 'password123',
        branchId: adminBranchId,
        role: 'MEMBER',
      })

    expect(response.status).toBe(201)

    // Then: Verifica side-effects no banco
    const user = await prisma.user.findUnique({
      where: { email: memberEmail },
    })
    expect(user).toBeDefined()

    const member = await prisma.member.findUnique({
      where: { email: memberEmail },
      include: { User: true, Branch: true },
    })
    expect(member).toBeDefined()
    expect(member?.userId).toBe(user?.id)
    expect(member?.branchId).toBe(adminBranchId)
    expect(member?.role).toBe('MEMBER')
    expect(member?.User).toBeDefined()
    expect(member?.Branch).toBeDefined()
  })

  // Teste adicional: 409 Conflict - Email duplicado
  it('deve retornar 400 ou 409 se email já estiver em uso', async () => {
    // Given: Member existente com email
    const existingEmail = `existing-${Date.now()}@test.com`
    
    const existingUser = await createTestUser({ email: existingEmail })
    await createTestMember({
      userId: existingUser.id,
      email: existingEmail,
      role: 'MEMBER' as any,
      branchId: adminBranchId,
    })

    // When: Tentar criar member com mesmo email
    const response = await request(app.server)
      .post('/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Membro Duplicado',
        email: existingEmail,
        password: 'password123',
        branchId: adminBranchId,
      })

    // Then: Retorna 400 ou 409
    expect([400, 409]).toContain(response.status)
    expect(response.body.error || response.body.message).toBeDefined()
  })
})

