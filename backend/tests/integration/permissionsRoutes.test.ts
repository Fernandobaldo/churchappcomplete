import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { authenticate } from '../../src/middlewares/authenticate'
import { logTestResponse } from '../utils/testResponseHelper'
import { 
  createTestUser,
  createTestPlan,
  createTestChurch,
  createTestBranch,
  createTestMember,
} from '../utils/testFactories'

describe('Permissions Routes - Integração', () => {
  const app = Fastify()
  let adminToken: string
  let adminMemberId: string
  let adminBranchId: string
  let adminChurchId: string
  let coordinatorToken: string
  let coordinatorMemberId: string
  let memberToken: string
  let memberId: string

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
      await createTestPlan({
        name: 'Free Plan',
        price: 0,
        features: ['basic'],
        maxMembers: 10,
        maxBranches: 1,
      })

    // Criar igreja
    const church = await createTestChurch({
      name: 'Igreja Teste Permissões',
    })
    adminChurchId = church.id

    // Criar filial
    const branch = await createTestBranch({
      name: 'Filial Teste Permissões',
      churchId: church.id,
    })
    adminBranchId = branch.id

    // Criar usuário ADMINGERAL
    const adminUser = await createTestUser({
      firstName: 'Admin',
      lastName: 'Permissões',
      email: 'adminperms@example.com',
      password: 'password123',
    })

    const adminMember = await createTestMember({
      name: 'Admin Member Permissões',
      email: 'adminmemberperms@example.com',
      branchId: branch.id,
      role: 'ADMINGERAL',
      userId: adminUser.id,
    })

    // Buscar adminMember com Permission incluída
    const adminMemberWithPermission = await prisma.member.findUnique({
      where: { id: adminMember.id },
      include: { Permission: true },
    })
    adminMemberId = adminMemberWithPermission!.id

    const adminFullName = `${adminUser.firstName} ${adminUser.lastName}`.trim()
    adminToken = app.jwt.sign({
      sub: adminUser.id,
      email: adminUser.email,
      name: adminFullName,
      type: 'member',
      memberId: adminMemberWithPermission!.id,
      role: adminMemberWithPermission!.role,
      branchId: adminMemberWithPermission!.branchId,
      churchId: church.id,
      permissions: adminMemberWithPermission!.Permission.map(p => p.type),
    })

    // Criar usuário COORDINATOR
    const coordinatorUser = await createTestUser({
      firstName: 'Coordinator',
      lastName: 'Permissões',
      email: 'coordperms@example.com',
      password: 'password123',
    })

    const coordinatorMember = await createTestMember({
      name: 'Coordinator Member Permissões',
      email: 'coordmemberperms@example.com',
      branchId: branch.id,
      role: 'COORDINATOR',
      userId: coordinatorUser.id,
    })

    // Buscar coordinatorMember com Permission incluída
    const coordinatorMemberWithPermission = await prisma.member.findUnique({
      where: { id: coordinatorMember.id },
      include: { Permission: true },
    })
    coordinatorMemberId = coordinatorMemberWithPermission!.id

    const coordinatorFullName = `${coordinatorUser.firstName} ${coordinatorUser.lastName}`.trim()
    coordinatorToken = app.jwt.sign({
      sub: coordinatorUser.id,
      email: coordinatorUser.email,
      name: coordinatorFullName,
      type: 'member',
      memberId: coordinatorMemberWithPermission!.id,
      role: coordinatorMemberWithPermission!.role,
      branchId: coordinatorMemberWithPermission!.branchId,
      churchId: church.id,
      permissions: coordinatorMemberWithPermission!.Permission.map(p => p.type),
    })

    // Criar usuário MEMBER
    const memberUser = await createTestUser({
      firstName: 'Member',
      lastName: 'Permissões',
      email: 'memberperms@example.com',
      password: 'password123',
    })

    const regularMember = await createTestMember({
      name: 'Regular Member Permissões',
      email: 'regularmemberperms@example.com',
      branchId: branch.id,
      role: 'MEMBER',
      userId: memberUser.id,
    })

    // Buscar regularMember com Permission incluída
    const regularMemberWithPermission = await prisma.member.findUnique({
      where: { id: regularMember.id },
      include: { Permission: true },
    })
    memberId = regularMemberWithPermission!.id

    const memberFullName = `${memberUser.firstName} ${memberUser.lastName}`.trim()
    memberToken = app.jwt.sign({
      sub: memberUser.id,
      email: memberUser.email,
      name: memberFullName,
      type: 'member',
      memberId: regularMemberWithPermission!.id,
      role: regularMemberWithPermission!.role,
      branchId: regularMemberWithPermission!.branchId,
      churchId: church.id,
      permissions: regularMemberWithPermission!.Permission.map(p => p.type),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /permissions/:id', () => {
    it('ADMINGERAL deve conseguir atribuir permissões a um membro', async () => {
      const permissions = ['devotional_manage', 'members_view']
      
      const response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('added', 2)
      expect(response.body).toHaveProperty('permissions')
      expect(Array.isArray(response.body.permissions)).toBe(true)
      expect(response.body.permissions.length).toBe(2)
      
      // Verifica estrutura das permissões retornadas
      response.body.permissions.forEach((perm: any) => {
        expect(perm).toHaveProperty('id')
        expect(perm).toHaveProperty('type')
        expect(typeof perm.id).toBe('string')
        expect(typeof perm.type).toBe('string')
      })
      
      // Verifica que as permissões foram salvas corretamente
      const permissionTypes = response.body.permissions.map((p: any) => p.type)
      expect(permissionTypes).toContain('devotional_manage')
      expect(permissionTypes).toContain('members_view')
      
      // Verifica no banco que as permissões foram salvas
      const dbPermissions = await prisma.permission.findMany({
        where: { memberId },
      })
      expect(dbPermissions.length).toBe(2)
      const dbPermissionTypes = dbPermissions.map(p => p.type)
      expect(dbPermissionTypes).toContain('devotional_manage')
      expect(dbPermissionTypes).toContain('members_view')
    })

    it('deve retornar permissões atualizadas na resposta', async () => {
      const permissions = ['events_manage']
      
      const response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.permissions).toBeDefined()
      expect(Array.isArray(response.body.permissions)).toBe(true)
      expect(response.body.permissions.length).toBe(1)
      expect(response.body.permissions[0]).toHaveProperty('id')
      expect(response.body.permissions[0]).toHaveProperty('type', 'events_manage')
      
      // Verifica que não tem campo removed na resposta
      expect(response.body).not.toHaveProperty('removed')
    })

    it('deve substituir todas as permissões existentes', async () => {
      // Primeiro adiciona algumas permissões
      await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage', 'members_view'] })

      // Depois substitui por outras permissões (usando permissão não restrita, pois o membro é MEMBER)
      const response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['events_manage'] })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(1)
      expect(response.body.permissions[0].type).toBe('events_manage')
      
      // Verifica no banco que apenas a nova permissão existe
      const memberPermissions = await prisma.permission.findMany({
        where: { memberId },
      })
      expect(memberPermissions.length).toBe(1)
      expect(memberPermissions[0].type).toBe('events_manage')
    })

    it('deve permitir remover todas as permissões enviando array vazio', async () => {
      // Primeiro adiciona permissões
      await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage'] })

      // Depois remove todas
      const response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: [] })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.permissions).toBeDefined()
      expect(Array.isArray(response.body.permissions)).toBe(true)
      expect(response.body.permissions.length).toBe(0)
      
      // Verifica no banco que não há permissões
      const memberPermissions = await prisma.permission.findMany({
        where: { memberId },
      })
      expect(memberPermissions.length).toBe(0)
    })

    it('deve retornar 403 quando COORDINATOR tenta atribuir permissões', async () => {
      const response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ permissions: ['devotional_manage'] })

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
    })

    it('deve retornar 403 quando MEMBER tenta atribuir permissões', async () => {
      const response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ permissions: ['devotional_manage'] })

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
    })

    it('deve retornar 401 quando não autenticado', async () => {
      const response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .send({ permissions: ['devotional_manage'] })

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
    })

    it('deve retornar 400 quando permissions não é um array', async () => {
      const response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: 'not-an-array' })

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
    })
  })

  describe('GET /members/:id - Retornar permissões', () => {
    beforeEach(async () => {
      // Garantir que o membro tem algumas permissões para teste
      await prisma.permission.deleteMany({ where: { memberId } })
      await prisma.permission.createMany({
        data: [
          { memberId, type: 'devotional_manage' },
          { memberId, type: 'members_view' },
        ],
      })
    })

    it('deve retornar permissões do membro no GET /members/:id', async () => {
      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('permissions')
      expect(Array.isArray(response.body.permissions)).toBe(true)
      expect(response.body.permissions.length).toBe(2)
      
      // Verifica estrutura das permissões
      response.body.permissions.forEach((perm: any) => {
        expect(perm).toHaveProperty('id')
        expect(perm).toHaveProperty('type')
        expect(typeof perm.id).toBe('string')
        expect(typeof perm.type).toBe('string')
      })
      
      // Verifica tipos específicos
      const permissionTypes = response.body.permissions.map((p: any) => p.type)
      expect(permissionTypes).toContain('devotional_manage')
      expect(permissionTypes).toContain('members_view')
    })

    it('deve retornar array vazio quando membro não tem permissões', async () => {
      // Remove todas as permissões
      await prisma.permission.deleteMany({ where: { memberId } })

      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('permissions')
      expect(Array.isArray(response.body.permissions)).toBe(true)
      expect(response.body.permissions.length).toBe(0)
    })

    it('deve retornar permissões atualizadas após POST /permissions/:id', async () => {
      // Atualiza permissões (usando apenas permissões não restritas, pois memberId tem role MEMBER)
      const updateResponse = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['events_manage', 'members_view'] })

      logTestResponse(updateResponse, 200)
      expect(updateResponse.status).toBe(200)
      expect(updateResponse.body).toHaveProperty('success', true)
      expect(updateResponse.body.permissions).toBeDefined()
      expect(updateResponse.body.permissions.length).toBe(2)
      
      // Verifica que o POST retornou as permissões corretas
      const updatePermissionTypes = updateResponse.body.permissions.map((p: any) => p.type)
      expect(updatePermissionTypes).toContain('events_manage')
      expect(updatePermissionTypes).toContain('members_view')

      // Busca o membro novamente
      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(2)
      
      const permissionTypes = response.body.permissions.map((p: any) => p.type)
      expect(permissionTypes).toContain('events_manage')
      expect(permissionTypes).toContain('members_view')
      expect(permissionTypes).not.toContain('devotional_manage')
    })

    it('deve retornar permissões corretamente mesmo após múltiplas atualizações', async () => {
      // Primeira atualização: adiciona permissão
      await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage'] })

      let response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(1)
      expect(response.body.permissions[0].type).toBe('devotional_manage')

      // Segunda atualização: adiciona outra permissão
      await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage', 'members_view'] })

      response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(2)
      const permissionTypes = response.body.permissions.map((p: any) => p.type)
      expect(permissionTypes).toContain('devotional_manage')
      expect(permissionTypes).toContain('members_view')

      // Terceira atualização: remove uma permissão
      await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['members_view'] })

      response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(1)
      expect(response.body.permissions[0].type).toBe('members_view')
    })

    it('deve garantir que permissões sempre estejam no campo permissions da resposta', async () => {
      // Testa com permissões
      await prisma.permission.deleteMany({ where: { memberId } })
      await prisma.permission.createMany({
        data: [
          { memberId, type: 'devotional_manage' },
        ],
      })

      let response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('permissions')
      expect(Array.isArray(response.body.permissions)).toBe(true)
      expect(response.body.permissions.length).toBe(1)

      // Testa sem permissões
      await prisma.permission.deleteMany({ where: { memberId } })

      response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('permissions')
      expect(Array.isArray(response.body.permissions)).toBe(true)
      expect(response.body.permissions.length).toBe(0)
    })
  })

  describe('GET /members - Lista de membros com permissões', () => {
    it('deve retornar permissões de cada membro na lista', async () => {
      // Garantir que alguns membros têm permissões
      await prisma.permission.deleteMany({ where: { memberId } })
      await prisma.permission.createMany({
        data: [
          { memberId, type: 'devotional_manage' },
        ],
      })

      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${adminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      
      // Encontra o membro na lista
      const memberInList = response.body.find((m: any) => m.id === memberId)
      expect(memberInList).toBeDefined()
      expect(memberInList).toHaveProperty('permissions')
      expect(Array.isArray(memberInList.permissions)).toBe(true)
      
      // Verifica que as permissões estão presentes
      const permissionTypes = memberInList.permissions.map((p: any) => p.type)
      expect(permissionTypes).toContain('devotional_manage')
    })
  })

  describe('Middleware checkPermission - Verificação de permissões atualizadas', () => {
    it('deve permitir criar devocional após atribuir permissão devotional_manage', async () => {
      // Remove permissões existentes do coordinator
      await prisma.permission.deleteMany({ where: { memberId: coordinatorMemberId } })
      
      // Atribui permissão devotional_manage ao coordinator
      await request(app.server)
        .post(`/permissions/${coordinatorMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage'] })

      // Busca o membro atualizado para obter userId
      const updatedMember = await prisma.member.findUnique({
        where: { id: coordinatorMemberId },
        include: { Permission: true, User: true },
      })

      if (!updatedMember || !updatedMember.userId) {
        throw new Error('Membro não encontrado ou sem userId')
      }

      // Cria token com permissões ANTIGAS (simula token desatualizado)
      // O middleware deve buscar permissões atualizadas do banco
      const outdatedToken = app.jwt.sign({
        sub: updatedMember.userId,
        email: updatedMember.User?.email || 'coordperms@example.com',
        name: updatedMember.name,
        type: 'member',
        memberId: coordinatorMemberId,
        role: 'COORDINATOR', // COORDINATOR tem role permitida pelo checkRole
        branchId: adminBranchId,
        churchId: adminChurchId,
        permissions: [], // Token sem permissões, mas banco tem
      })

      // Tenta criar devocional - o middleware deve buscar permissões atualizadas do banco
      const devotionalData = {
        title: 'Devocional Teste Permissões',
        content: 'Conteúdo do devocional',
        passage: 'João 3:16',
      }

      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${outdatedToken}`)
        .send(devotionalData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Devocional Teste Permissões')
    })

    it('deve negar criar devocional quando permissão é removida', async () => {
      // Remove todas as permissões
      await prisma.permission.deleteMany({ where: { memberId } })

      const updatedMember = await prisma.member.findUnique({
        where: { id: memberId },
        include: { User: true },
      })

      if (!updatedMember || !updatedMember.userId) {
        throw new Error('Membro não encontrado ou sem userId')
      }

      // Cria token com permissão antiga (simula token desatualizado)
      const outdatedToken = app.jwt.sign({
        sub: updatedMember.userId,
        email: updatedMember.User?.email || 'memberperms@example.com',
        name: updatedMember.name,
        type: 'member',
        memberId: memberId,
        role: 'MEMBER',
        branchId: adminBranchId,
        churchId: adminChurchId,
        permissions: ['devotional_manage'], // Token ainda tem permissão antiga
      })

      const devotionalData = {
        title: 'Devocional Teste Negado',
        content: 'Conteúdo do devocional',
        passage: 'João 3:16',
      }

      const response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${outdatedToken}`)
        .send(devotionalData)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Acesso negado')
    })

    it('deve buscar permissões atualizadas do banco mesmo com token desatualizado', async () => {
      // Remove todas as permissões primeiro do coordinator
      await prisma.permission.deleteMany({ where: { memberId: coordinatorMemberId } })

      const updatedMember = await prisma.member.findUnique({
        where: { id: coordinatorMemberId },
        include: { User: true },
      })

      if (!updatedMember || !updatedMember.userId) {
        throw new Error('Membro não encontrado ou sem userId')
      }

      // Cria token sem permissões
      const tokenWithoutPermissions = app.jwt.sign({
        sub: updatedMember.userId,
        email: updatedMember.User?.email || 'coordperms@example.com',
        name: updatedMember.name,
        type: 'member',
        memberId: coordinatorMemberId,
        role: 'COORDINATOR',
        branchId: adminBranchId,
        churchId: adminChurchId,
        permissions: [], // Token sem permissões
      })

      // Tenta criar devocional sem permissão - deve negar
      const devotionalData = {
        title: 'Devocional Sem Permissão',
        content: 'Conteúdo',
        passage: 'João 3:16',
      }

      let response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${tokenWithoutPermissions}`)
        .send(devotionalData)

      expect(response.status).toBe(403)

      // Agora atribui permissão via API (simula admin atribuindo)
      await request(app.server)
        .post(`/permissions/${coordinatorMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage'] })

      // Verifica que a permissão foi salva no banco
      const permissionsInDb = await prisma.permission.findMany({
        where: { memberId: coordinatorMemberId },
      })
      expect(permissionsInDb.length).toBe(1)
      expect(permissionsInDb[0].type).toBe('devotional_manage')

      // Tenta criar devocional novamente com o mesmo token (sem permissões no token)
      // O middleware deve buscar permissões atualizadas do banco e permitir
      response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${tokenWithoutPermissions}`)
        .send({
          title: 'Devocional Com Permissão Atualizada',
          content: 'Conteúdo',
          passage: 'João 3:16',
        })

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
    })

    it('deve atualizar permissões e permitir acesso imediatamente', async () => {
      // Remove todas as permissões do coordinator
      await prisma.permission.deleteMany({ where: { memberId: coordinatorMemberId } })

      const updatedMember = await prisma.member.findUnique({
        where: { id: coordinatorMemberId },
        include: { User: true },
      })

      if (!updatedMember || !updatedMember.userId) {
        throw new Error('Membro não encontrado ou sem userId')
      }

      const coordinatorToken = app.jwt.sign({
        sub: updatedMember.userId,
        email: updatedMember.User?.email || 'coordperms@example.com',
        name: updatedMember.name,
        type: 'member',
        memberId: coordinatorMemberId,
        role: 'COORDINATOR',
        branchId: adminBranchId,
        churchId: adminChurchId,
        permissions: [],
      })

      // Tenta criar devocional - deve negar (sem permissão)
      let response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          title: 'Teste',
          content: 'Conteúdo',
          passage: 'João 3:16',
        })

      expect(response.status).toBe(403)

      // Atribui permissão
      await request(app.server)
        .post(`/permissions/${coordinatorMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage'] })

      // Tenta criar devocional novamente - deve permitir agora
      response = await request(app.server)
        .post('/devotionals')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          title: 'Devocional Após Permissão',
          content: 'Conteúdo',
          passage: 'João 3:16',
        })

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
    })
  })

  describe('Fluxo completo: Atualizar permissões e recuperar', () => {
    it('deve manter permissões após múltiplas atualizações e recuperações', async () => {
      // Remove todas as permissões
      await prisma.permission.deleteMany({ where: { memberId } })

      // Primeira atualização: adiciona permissão
      let response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage'] })

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(1)

      // Busca o membro - deve ter a permissão
      response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(1)
      expect(response.body.permissions[0].type).toBe('devotional_manage')

      // Segunda atualização: adiciona outra permissão
      response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage', 'members_view'] })

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(2)

      // Busca o membro novamente - deve ter ambas as permissões
      response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(2)
      const permissionTypes = response.body.permissions.map((p: any) => p.type)
      expect(permissionTypes).toContain('devotional_manage')
      expect(permissionTypes).toContain('members_view')

      // Terceira atualização: remove uma permissão
      response = await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['members_view'] })

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(1)

      // Busca o membro novamente - deve ter apenas a permissão restante
      response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.permissions.length).toBe(1)
      expect(response.body.permissions[0].type).toBe('members_view')
    })

    it('deve garantir que GET /members retorna permissões atualizadas', async () => {
      // Remove todas as permissões
      await prisma.permission.deleteMany({ where: { memberId } })

      // Busca lista de membros - membro não deve ter permissões
      let response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      const memberInList = response.body.find((m: any) => m.id === memberId)
      expect(memberInList).toBeDefined()
      expect(memberInList.permissions.length).toBe(0)

      // Atribui permissão
      await request(app.server)
        .post(`/permissions/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['devotional_manage'] })

      // Busca lista de membros novamente - membro deve ter permissão
      response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      const updatedMemberInList = response.body.find((m: any) => m.id === memberId)
      expect(updatedMemberInList).toBeDefined()
      expect(updatedMemberInList.permissions.length).toBe(1)
      expect(updatedMemberInList.permissions[0].type).toBe('devotional_manage')
    })
  })
})

