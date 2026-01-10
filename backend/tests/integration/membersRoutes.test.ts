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

describe('Members Routes - Integration Tests', () => {
  let app: FastifyInstance
  let planId: string
  let adminUser: any
  let adminMember: any
  let adminToken: string
  let adminMemberId: string
  let adminBranchId: string
  let adminChurchId: string
  let coordinatorUser: any
  let coordinatorMember: any
  let coordinatorToken: string
  let coordinatorMemberId: string
  let memberUser: any
  let regularMember: any
  let memberToken: string
  let memberId: string

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

    // Criar plano novamente após reset
    const plan = await createTestPlan({
      name: 'Free Plan',
      maxMembers: 10,
      maxBranches: 1,
    })
    planId = plan.id

    // Criar Church
    const church = await createTestChurch({
      name: 'Igreja Teste',
    })
    adminChurchId = church.id

    // Criar Branch
    const branch = await createTestBranch({
      churchId: church.id,
      name: 'Filial Teste',
      isMainBranch: true,
    })
    adminBranchId = branch.id

    // Criar User e Member ADMINGERAL
    adminUser = await createTestUser({
      email: `admin-${Date.now()}@test.com`,
      firstName: 'Admin',
      lastName: 'User',
      password: 'password123',
    })

    await createTestSubscription(adminUser.id, planId, SubscriptionStatus.active)

    adminMember = await createTestMember({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'ADMINGERAL' as any,
      branchId: branch.id,
    })
    adminMemberId = adminMember.id

    const adminMemberWithPermissions = await prisma.member.findUnique({
      where: { id: adminMember.id },
      include: { Permission: true },
    })

    adminToken = await generateTestToken(app, {
      sub: adminUser.id,
      email: adminUser.email,
      name: `${adminUser.firstName} ${adminUser.lastName}`.trim(),
      type: 'member',
      memberId: adminMember.id,
      role: adminMember.role,
      branchId: branch.id,
      churchId: church.id,
      permissions: adminMemberWithPermissions!.Permission.map(p => p.type),
      onboardingCompleted: true,
    })

    // Criar User e Member COORDINATOR
    coordinatorUser = await createTestUser({
      email: `coordinator-${Date.now()}@test.com`,
      firstName: 'Coordinator',
      lastName: 'User',
    })

    await createTestSubscription(coordinatorUser.id, planId, SubscriptionStatus.active)

    coordinatorMember = await createTestMember({
      userId: coordinatorUser.id,
      email: coordinatorUser.email,
      role: 'COORDINATOR' as any,
      branchId: branch.id,
    })
    coordinatorMemberId = coordinatorMember.id

    const coordinatorMemberWithPermissions = await prisma.member.findUnique({
      where: { id: coordinatorMember.id },
      include: { Permission: true },
    })

    coordinatorToken = await generateTestToken(app, {
      sub: coordinatorUser.id,
      email: coordinatorUser.email,
      name: `${coordinatorUser.firstName} ${coordinatorUser.lastName}`.trim(),
      type: 'member',
      memberId: coordinatorMember.id,
      role: coordinatorMember.role,
      branchId: branch.id,
      churchId: church.id,
      permissions: coordinatorMemberWithPermissions!.Permission.map(p => p.type),
      onboardingCompleted: true,
    })

    // Criar User e Member MEMBER
    memberUser = await createTestUser({
      email: `member-${Date.now()}@test.com`,
      firstName: 'Member',
      lastName: 'User',
    })

    await createTestSubscription(memberUser.id, planId, SubscriptionStatus.active)

    regularMember = await createTestMember({
      userId: memberUser.id,
      email: memberUser.email,
      role: 'MEMBER' as any,
      branchId: branch.id,
    })
    memberId = regularMember.id

    const regularMemberWithPermissions = await prisma.member.findUnique({
      where: { id: regularMember.id },
      include: { Permission: true },
    })

    memberToken = await generateTestToken(app, {
      sub: memberUser.id,
      email: memberUser.email,
      name: `${memberUser.firstName} ${memberUser.lastName}`.trim(),
      type: 'member',
      memberId: regularMember.id,
      role: regularMember.role,
      branchId: branch.id,
      churchId: church.id,
      permissions: regularMemberWithPermissions!.Permission.map(p => p.type),
      onboardingCompleted: true,
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('GET /members', () => {
    // Teste 1: 200/201 Success - ADMINGERAL
    it('ADMINGERAL deve ver todos os membros da igreja (200 OK)', async () => {
      // Given: ADMINGERAL autenticado
      // When: GET /members
      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 200 com todos os membros da igreja
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThanOrEqual(3) // Admin, Coordinator, Member
      
      // Verifica que cada membro tem permissões na resposta
      response.body.forEach((member: any) => {
        expect(member).toHaveProperty('permissions')
        expect(Array.isArray(member.permissions)).toBe(true)
      })
    })

    // Teste 2: 200/201 Success - COORDINATOR
    it('COORDINATOR deve ver membros da sua filial (200 OK)', async () => {
      // Given: COORDINATOR autenticado
      // When: GET /members
      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${coordinatorToken}`)

      // Then: Retorna 200 com membros da mesma filial
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThanOrEqual(3)
    })

    // Teste 3: 200/201 Success - MEMBER
    it('MEMBER deve ver todos os membros da sua filial (200 OK)', async () => {
      // Given: MEMBER autenticado
      // When: GET /members
      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${memberToken}`)

      // Then: Retorna 200 com membros da mesma filial
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThanOrEqual(3)
      
      // Verifica que o próprio membro está na lista
      const selfMember = response.body.find((m: any) => m.id === memberId)
      expect(selfMember).toBeDefined()
      expect(selfMember).toHaveProperty('id', memberId)
      expect(selfMember).toHaveProperty('name', regularMember.name)
    })

    // Teste 4: 401 Unauthenticated
    it('deve retornar 401 quando não autenticado', async () => {
      // Given: Requisição sem token
      // When: GET /members sem Authorization
      const response = await request(app.server).get('/members')

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 7: DB side-effect assertions (verificação de filtragem)
    it('deve retornar apenas membros da mesma igreja', async () => {
      // Given: Outra igreja com membros
      const otherChurch = await createTestChurch({
        name: 'Outra Igreja',
      })

      const otherBranch = await createTestBranch({
        churchId: otherChurch.id,
        name: 'Filial Outra Igreja',
      })

      const otherUser = await createTestUser({
        email: `other-${Date.now()}@test.com`,
      })

      await createTestSubscription(otherUser.id, planId, SubscriptionStatus.active)

      await createTestMember({
        userId: otherUser.id,
        email: otherUser.email,
        role: 'MEMBER' as any,
        branchId: otherBranch.id,
      })

      // When: GET /members como ADMINGERAL
      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Não inclui membros da outra igreja
      expect(response.status).toBe(200)
      const otherChurchMemberIds = response.body
        .map((m: any) => m.id)
        .filter((id: string) => id.startsWith(otherBranch.id))
      expect(otherChurchMemberIds.length).toBe(0)
    })
  })

  describe('GET /members/me', () => {
    // Teste 1: 200/201 Success
    it('deve retornar perfil do usuário autenticado (200 OK)', async () => {
      // Given: MEMBER autenticado
      // When: GET /members/me
      const response = await request(app.server)
        .get('/members/me')
        .set('Authorization', `Bearer ${memberToken}`)

      // Then: Retorna 200 com dados do próprio membro
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', memberId)
      expect(response.body).toHaveProperty('name', regularMember.name)
      expect(response.body).toHaveProperty('email', regularMember.email)
    })

    // Teste 2: 404 Not Found
    it('deve retornar 404 quando usuário não tem membro associado', async () => {
      // Given: Usuário sem member
      const userWithoutMember = await createTestUser({
        email: `nowmember-${Date.now()}@test.com`,
      })

      await createTestSubscription(userWithoutMember.id, planId, SubscriptionStatus.active)

      const tokenWithoutMember = await generateTestToken(app, {
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: `${userWithoutMember.firstName} ${userWithoutMember.lastName}`.trim(),
        type: 'user',
        memberId: null,
        role: null,
        branchId: null,
        churchId: null,
        permissions: [],
        onboardingCompleted: false,
      })

      // When: GET /members/me
      const response = await request(app.server)
        .get('/members/me')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      // Then: Retorna 404
      expect(response.status).toBe(404)
    })

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 quando não autenticado', async () => {
      // Given: Requisição sem token
      // When: GET /members/me sem Authorization
      const response = await request(app.server).get('/members/me')

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })
  })

  describe('GET /members/:id', () => {
    // Teste 1: 200/201 Success - ADMINGERAL
    it('ADMINGERAL deve ver qualquer membro da igreja (200 OK)', async () => {
      // Given: ADMINGERAL autenticado
      // When: GET /members/:id
      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 200 com dados do membro
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', memberId)
      expect(response.body).toHaveProperty('permissions')
      expect(Array.isArray(response.body.permissions)).toBe(true)
    })

    // Teste 2: 200/201 Success - COORDINATOR
    it('COORDINATOR deve ver membros da sua filial (200 OK)', async () => {
      // Given: COORDINATOR autenticado
      // When: GET /members/:id de membro da mesma filial
      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`)

      // Then: Retorna 200 com dados do membro
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', memberId)
      expect(response.body).toHaveProperty('permissions')
    })

    // Teste 3: 200/201 Success - MEMBER
    it('MEMBER deve ver a si mesmo (200 OK)', async () => {
      // Given: MEMBER autenticado
      // When: GET /members/:id do próprio membro
      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`)

      // Then: Retorna 200 com dados do próprio membro
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', memberId)
      expect(response.body).toHaveProperty('permissions')
    })

    // Teste 4: 200/201 Success - MEMBER pode ver outros da mesma filial
    it('MEMBER pode ver outros membros da mesma filial (200 OK)', async () => {
      // Given: MEMBER autenticado e outro membro na mesma filial
      // When: GET /members/:id de outro membro da mesma filial
      const response = await request(app.server)
        .get(`/members/${adminMemberId}`)
        .set('Authorization', `Bearer ${memberToken}`)

      // Then: Retorna 200
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', adminMemberId)
    })

    // Teste 5: 403 Forbidden - MEMBER não vê membros de outras filiais
    it('MEMBER não deve ver membros de outras filiais', async () => {
      // Given: Outra filial com membro
      const otherBranch = await createTestBranch({
        churchId: adminChurchId,
        name: 'Outra Filial',
      })

      const otherBranchUser = await createTestUser({
        email: `otherbranch-${Date.now()}@test.com`,
      })

      await createTestSubscription(otherBranchUser.id, planId, SubscriptionStatus.active)

      const otherBranchMember = await createTestMember({
        userId: otherBranchUser.id,
        email: otherBranchUser.email,
        role: 'MEMBER' as any,
        branchId: otherBranch.id,
      })

      // When: GET /members/:id de membro de outra filial
      const response = await request(app.server)
        .get(`/members/${otherBranchMember.id}`)
        .set('Authorization', `Bearer ${memberToken}`)

      // Then: Retorna 403
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error', 'Você só pode visualizar membros da sua filial')
    })

    // Teste 6: 403 Forbidden - ADMINGERAL não vê membros de outras igrejas
    it('ADMINGERAL não deve ver membros de outras igrejas', async () => {
      // Given: Outra igreja com membro
      const otherChurch = await createTestChurch({
        name: 'Outra Igreja',
      })

      const otherBranch = await createTestBranch({
        churchId: otherChurch.id,
        name: 'Filial Outra Igreja',
      })

      const otherChurchUser = await createTestUser({
        email: `otherchurch-${Date.now()}@test.com`,
      })

      await createTestSubscription(otherChurchUser.id, planId, SubscriptionStatus.active)

      const otherChurchMember = await createTestMember({
        userId: otherChurchUser.id,
        email: otherChurchUser.email,
        role: 'MEMBER' as any,
        branchId: otherBranch.id,
      })

      // When: GET /members/:id de membro de outra igreja
      const response = await request(app.server)
        .get(`/members/${otherChurchMember.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 403
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error', 'Você só pode visualizar membros da sua igreja')
    })

    // Teste 7: 404 Not Found
    it('deve retornar 404 quando membro não existe', async () => {
      // Given: ID inexistente
      const fakeId = 'cmic00000000000000000000000'

      // When: GET /members/:id
      const response = await request(app.server)
        .get(`/members/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 404
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /members/:id', () => {
    // Teste 1: 200/201 Success
    it('deve atualizar membro com sucesso (200 OK)', async () => {
      // Given: Dados de atualização
      const updateData = {
        name: 'Member Atualizado',
        phone: '11999999999',
      }

      // When: PUT /members/:id
      const response = await request(app.server)
        .put(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      // Then: Retorna 200 com dados atualizados
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('name', 'Member Atualizado')
      expect(response.body).toHaveProperty('phone', '11999999999')
    })

    // Teste 2: 200/201 Success - Com avatarUrl
    it('deve atualizar membro com avatarUrl', async () => {
      // Given: Dados com avatarUrl
      const updateData = {
        avatarUrl: 'http://localhost:3000/uploads/avatars/test-avatar.png',
      }

      // When: PUT /members/:id
      const response = await request(app.server)
        .put(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      // Then: Retorna 200 com avatarUrl atualizado
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('avatarUrl', 'http://localhost:3000/uploads/avatars/test-avatar.png')
    })

    // Teste 3: 200/201 Success - Com positionId
    it('deve atualizar membro com positionId', async () => {
      // Given: Position criada
      const position = await prisma.churchPosition.create({
        data: {
          name: 'Pastor',
          churchId: adminChurchId,
          isDefault: true,
        },
      })

      const updateData = {
        positionId: position.id,
      }

      // When: PUT /members/:id
      const response = await request(app.server)
        .put(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      // Then: Retorna 200 e positionId atualizado no banco
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id')

      const updatedMember = await prisma.member.findUnique({
        where: { id: memberId },
        include: { Position: true },
      })
      expect(updatedMember?.positionId).toBe(position.id)
      expect(updatedMember?.Position?.name).toBe('Pastor')
    })

    // Teste 4: 401 Unauthenticated
    it('deve retornar 401 quando não autenticado', async () => {
      // Given: Dados válidos sem token
      const updateData = {
        name: 'Teste',
      }

      // When: PUT /members/:id sem Authorization
      const response = await request(app.server)
        .put(`/members/${memberId}`)
        .send(updateData)

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 5: 403 Forbidden
    it('deve retornar 403 quando MEMBER tenta atualizar outro membro', async () => {
      // Given: MEMBER autenticado tentando atualizar outro membro
      const updateData = {
        name: 'Tentativa de Atualização',
      }

      // When: PUT /members/:id de outro membro
      const response = await request(app.server)
        .put(`/members/${adminMemberId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updateData)

      // Then: Retorna 403
      expect(response.status).toBe(403)
    })

    // Teste 6: 404 Not Found
    it('deve retornar 404 quando membro não existe', async () => {
      // Given: ID inexistente
      const fakeId = 'cmic00000000000000000000000'
      const updateData = {
        name: 'Teste',
      }

      // When: PUT /members/:id
      const response = await request(app.server)
        .put(`/members/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      // Then: Retorna 404
      expect(response.status).toBe(404)
    })

    // Teste 7: DB side-effect assertions
    it('deve atualizar membro no banco de dados', async () => {
      // Given: Dados de atualização
      const updateData = {
        name: 'Member DB Updated',
        phone: '11988888888',
      }

      // When: PUT /members/:id
      const response = await request(app.server)
        .put(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      expect(response.status).toBe(200)

      // Then: Membro foi atualizado no banco
      const updatedMember = await prisma.member.findUnique({
        where: { id: memberId },
      })

      expect(updatedMember).not.toBeNull()
      expect(updatedMember?.name).toBe('Member DB Updated')
      expect(updatedMember?.phone).toBe('11988888888')
    })
  })
})
