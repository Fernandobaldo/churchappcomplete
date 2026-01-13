// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/db'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'
import { createTestUser, createTestMember, createTestChurch, createTestBranch, createTestPlan, createTestSubscription } from '../utils/testFactories'
import type { FastifyInstance } from 'fastify'
import { SubscriptionStatus } from '@prisma/client'



describe('POST /auth/login - Integration Tests', () => {
  let app: FastifyInstance
  let planId: string
  let userWithMember: { user: any; member: any }
  let userWithoutMember: any

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

    // Criar User com Member (para testes de login como member)
    const user = await createTestUser({
      email: `member-${Date.now()}@test.com`,
      firstName: 'Member',
      lastName: 'User',
      password: 'password123',
    })

    await createTestSubscription(user.id, planId, SubscriptionStatus.active)

    const church = await createTestChurch({
      name: 'Test Church',
      createdByUserId: user.id,
    })

    const branch = await createTestBranch({
      churchId: church.id,
      name: 'Sede',
      isMainBranch: true,
    })

    const member = await createTestMember({
      userId: user.id,
      email: user.email,
      role: 'ADMINGERAL' as any,
      branchId: branch.id,
    })

    userWithMember = { user, member }

    // Criar User sem Member (para testes de login como user)
    userWithoutMember = await createTestUser({
      email: `user-${Date.now()}@test.com`,
      firstName: 'Simple',
      lastName: 'User',
      password: 'password123',
    })

    await createTestSubscription(userWithoutMember.id, planId, SubscriptionStatus.active)
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  // Teste 1: 200/201 Success - Login como Member
  it('deve fazer login com member válido e retornar token com contexto de Member (200 OK)', async () => {
    // Given: User com Member criado
    // When: POST /auth/login com credenciais válidas
    const response = await request(app.server)
      .post('/auth/login')
      .send({ 
        email: userWithMember.user.email, 
        password: 'password123' 
      })

    // Then: Retorna 200 com token e contexto de Member
    expect(response.status).toBe(200)
    expect(response.body.token).toBeDefined()
    expect(response.body.user.email).toBe(userWithMember.user.email)
    expect(response.body.type).toBe('member')
    expect(response.body.user.password).toBeUndefined() // Segurança: senha não deve vir na resposta
    
    // Verifica contexto de Member no token
    expect(response.body.user.memberId).toBeDefined()
    expect(response.body.user.role).toBeDefined()
    expect(response.body.user.branchId).toBeDefined()
    expect(response.body.user.permissions).toBeDefined()
    expect(Array.isArray(response.body.user.permissions)).toBe(true)
  })

  // Teste 2: 200/201 Success - Login como User (sem Member)
  it('deve fazer login com user válido (sem Member) e retornar token sem contexto de Member (200 OK)', async () => {
    // Given: User sem Member criado
    // When: POST /auth/login com credenciais válidas
    const response = await request(app.server)
      .post('/auth/login')
      .send({ 
        email: userWithoutMember.email, 
        password: 'password123' 
      })

    // Then: Retorna 200 com token sem contexto de Member
    expect(response.status).toBe(200)
    expect(response.body.token).toBeDefined()
    expect(response.body.user.email).toBe(userWithoutMember.email)
    expect(response.body.type).toBe('user')
    expect(response.body.user.password).toBeUndefined()
    
    // User sem Member não deve ter contexto de Member
    expect(response.body.user.memberId).toBeUndefined()
    expect(response.body.user.role).toBeUndefined()
    expect(response.body.user.branchId).toBeUndefined()
  })

  // Teste 3: 400 Invalid payload
  it('deve retornar 400 se os campos obrigatórios estiverem ausentes', async () => {
    // Given: Requisição sem campos obrigatórios
    // When: POST /auth/login sem email e senha
    const response = await request(app.server)
      .post('/auth/login')
      .send({}) // sem email e senha

    // Then: Retorna 400
    expect(response.status).toBe(400)
    expect(response.body.message).toBeDefined()
  })

  it('deve retornar 400 se email estiver ausente', async () => {
    // Given: Requisição sem email
    // When: POST /auth/login apenas com senha
    const response = await request(app.server)
      .post('/auth/login')
      .send({ password: 'password123' })

    // Then: Retorna 400
    expect(response.status).toBe(400)
  })

  it('deve retornar 400 se senha estiver ausente', async () => {
    // Given: Requisição sem senha
    // When: POST /auth/login apenas com email
    const response = await request(app.server)
      .post('/auth/login')
      .send({ email: 'test@example.com' })

    // Then: Retorna 400
    expect(response.status).toBe(400)
  })

  // Teste 4: 401 Unauthenticated - Email não existe
  it('deve retornar 401 se o email não existir', async () => {
    // Given: Email que não existe no banco
    // When: POST /auth/login com email inexistente
    const response = await request(app.server)
      .post('/auth/login')
      .send({ 
        email: 'notfound@example.com', 
        password: 'password123' 
      })

    // Then: Retorna 401
    expect(response.status).toBe(401)
    expect(response.body.message).toContain('Credenciais inválidas')
  })

  // Teste 5: 401 Unauthenticated - Senha incorreta
  it('deve retornar 401 se a senha estiver incorreta', async () => {
    // Given: User válido no banco
    // When: POST /auth/login com senha incorreta
    const response = await request(app.server)
      .post('/auth/login')
      .send({ 
        email: userWithMember.user.email, 
        password: 'wrongpassword' 
      })

    // Then: Retorna 401
    expect(response.status).toBe(401)
    expect(response.body.message).toContain('Credenciais inválidas')
  })

  // Teste 6: 422 Business rule (não aplicável para login)
  // Nota: Login não tem regras de negócio além de validação de credenciais

  // Teste 7: DB side-effect assertions
  it('deve gerar token válido que pode ser decodificado corretamente', async () => {
    // Given: User com Member
    // When: POST /auth/login com credenciais válidas
    const response = await request(app.server)
      .post('/auth/login')
      .send({ 
        email: userWithMember.user.email, 
        password: 'password123' 
      })

    expect(response.status).toBe(200)
    const token = response.body.token

    // Then: Token pode ser decodificado e contém dados corretos
    const decoded = app.jwt.decode(token) as any
    expect(decoded.sub).toBe(userWithMember.user.id)
    expect(decoded.email).toBe(userWithMember.user.email)
    expect(decoded.memberId).toBe(userWithMember.member.id)
    expect(decoded.type).toBe('member')
  })

  // Teste adicional: Verificar que token inclui onboardingCompleted do banco
  it('deve incluir onboardingCompleted no token baseado no estado do banco', async () => {
    // Given: User com Member e onboarding marcado como completo no banco
    const { OnboardingProgressService } = await import('../../src/services/onboardingProgressService')
    const progressService = new OnboardingProgressService()
    // Criar progresso primeiro se não existir
    await progressService.getOrCreateProgress(userWithMember.user.id)
    await progressService.markComplete(userWithMember.user.id)

    // When: POST /auth/login
    const response = await request(app.server)
      .post('/auth/login')
      .send({ 
        email: userWithMember.user.email, 
        password: 'password123' 
      })

    expect(response.status).toBe(200)
    const token = response.body.token

    // Then: Token inclui onboardingCompleted = true
    const decoded = app.jwt.decode(token) as any
    expect(decoded.onboardingCompleted).toBe(true)
  })

  it('deve incluir onboardingCompleted = false quando onboarding não está completo', async () => {
    // Given: User com Member mas onboarding NÃO completo no banco
    // (já está no estado inicial do beforeEach)

    // When: POST /auth/login
    const response = await request(app.server)
      .post('/auth/login')
      .send({ 
        email: userWithMember.user.email, 
        password: 'password123' 
      })

    expect(response.status).toBe(200)
    const token = response.body.token

    // Then: Token inclui onboardingCompleted = false
    const decoded = app.jwt.decode(token) as any
    expect(decoded.onboardingCompleted).toBe(false)
  })
})

describe('GET /auth/me - Integration Tests', () => {
  let app: FastifyInstance
  let planId: string
  let userWithMember: { user: any; member: any; token: string }
  let userWithoutMember: { user: any; token: string }

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()

    // Criar plano para testes
    const plan = await createTestPlan({
      name: 'Free Plan',
      maxMembers: 10,
      maxBranches: 1,
    })
    planId = plan.id
  })

  beforeEach(async () => {
    await resetTestDatabase()

    // Criar plano novamente após reset (necessário para subscription)
    const plan = await createTestPlan({
      name: 'Free Plan',
      maxMembers: 10,
      maxBranches: 1,
    })
    planId = plan.id

    // Criar User com Member
    const user = await createTestUser({
      email: `member-${Date.now()}@test.com`,
      firstName: 'Member',
      lastName: 'User',
      password: 'password123',
    })

    await createTestSubscription(user.id, planId, SubscriptionStatus.active)

    const church = await createTestChurch({
      name: 'Test Church',
      createdByUserId: user.id,
    })

    const branch = await createTestBranch({
      churchId: church.id,
      name: 'Sede',
      isMainBranch: true,
    })

    const member = await createTestMember({
      userId: user.id,
      email: user.email,
      role: 'ADMINGERAL' as any,
      branchId: branch.id,
    })

    const token = await generateTestToken(app, {
      sub: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      type: 'member',
      memberId: member.id,
      role: 'ADMINGERAL',
      branchId: branch.id,
      churchId: church.id,
      permissions: [],
      onboardingCompleted: true,
    })

    userWithMember = { user, member, token }

    // Criar User sem Member
    const simpleUser = await createTestUser({
      email: `user-${Date.now()}@test.com`,
      firstName: 'Simple',
      lastName: 'User',
      password: 'password123',
    })

    await createTestSubscription(simpleUser.id, planId, SubscriptionStatus.active)

    const simpleToken = await generateTestToken(app, {
      sub: simpleUser.id,
      email: simpleUser.email,
      name: `${simpleUser.firstName} ${simpleUser.lastName}`.trim(),
      type: 'user',
      memberId: null,
      role: null,
      branchId: null,
      churchId: null,
      permissions: [],
      onboardingCompleted: false,
    })

    userWithoutMember = { user: simpleUser, token: simpleToken }
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  // Teste 1: 200/201 Success - Retornar perfil de member
  it('deve retornar perfil do usuário autenticado (member) (200 OK)', async () => {
    // Given: Token válido de member
    // When: GET /auth/me com Authorization header
    const response = await request(app.server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${userWithMember.token}`)

    // Then: Retorna 200 com dados do member
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('name')
    expect(response.body).toHaveProperty('email', userWithMember.user.email)
    expect(response.body).toHaveProperty('role')
    expect(response.body).toHaveProperty('branchId')
  })

  // Teste 2: 400 Invalid payload (não aplicável para GET)

  // Teste 3: 401 Unauthenticated - Token não fornecido
  it('deve retornar 401 quando token não é fornecido', async () => {
    // Given: Requisição sem Authorization header
    // When: GET /auth/me sem token
    const response = await request(app.server)
      .get('/auth/me')

    // Then: Retorna 401
    expect(response.status).toBe(401)
  })

  // Teste 4: 401 Unauthenticated - Token inválido
  it('deve retornar 401 quando token é inválido', async () => {
    // Given: Token inválido
    // When: GET /auth/me com token inválido
    const response = await request(app.server)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')

    // Then: Retorna 401
    expect(response.status).toBe(401)
  })

  // Teste 5: 403 Forbidden (não aplicável para /auth/me)

  // Teste 6: 409 Conflict (não aplicável)

  // Teste 7: 422 Business rule (não aplicável)

  // Teste adicional: 404 quando member não existe (caso específico do endpoint)
  it('deve retornar 404 quando member não existe para user com type=member', async () => {
    // Given: Token de user sem member (mas com type='member' no token)
    // Criar token que diz ser member mas não existe no banco
    const fakeToken = await generateTestToken(app, {
      sub: userWithoutMember.user.id,
      email: userWithoutMember.user.email,
      name: `${userWithoutMember.user.firstName} ${userWithoutMember.user.lastName}`.trim(),
      type: 'member',
      memberId: 'non-existent-member-id',
      role: 'ADMINGERAL',
      branchId: 'non-existent-branch-id',
      churchId: 'non-existent-church-id',
      permissions: [],
      onboardingCompleted: true,
    })

    // When: GET /auth/me com token que referencia member inexistente
    const response = await request(app.server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`)

    // Then: Retorna 404
    expect(response.status).toBe(404)
    expect(response.body.message).toContain('Membro não encontrado')
  })

  // DB side-effect assertions: verificar que dados retornados correspondem ao banco
  it('deve retornar dados que correspondem ao member no banco de dados', async () => {
    // Given: Member no banco
    // When: GET /auth/me
    const response = await request(app.server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${userWithMember.token}`)

    expect(response.status).toBe(200)

    // Then: Dados retornados correspondem ao banco
    const memberInDb = await prisma.member.findUnique({
      where: { id: userWithMember.member.id },
      include: { Branch: true },
    })

    expect(memberInDb).toBeDefined()
    expect(response.body.id).toBe(memberInDb?.id)
    expect(response.body.email).toBe(memberInDb?.email)
    expect(response.body.role).toBe(memberInDb?.role)
    expect(response.body.branchId).toBe(memberInDb?.branchId)
  })
})
