// tests/e2e/user-member-model.test.ts
// E2E test para Novo Modelo User + Member
// Padrão: Validar fluxo completo do novo modelo de usuário e membro
// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import '../setupTestEnv'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { createTestApp } from '../utils/createTestApp'
import { createTestPlan } from '../utils/testFactories'
import jwt from 'jsonwebtoken'

describe('E2E: Novo Modelo User + Member', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeAll(async () => {
    // Given - Setup do ambiente de teste
    app = await createTestApp()
    await resetTestDatabase()

    // Criar plano
    const existingPlan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } })
    if (!existingPlan) {
      await createTestPlan({
        name: 'Free Plan',
        price: 0,
        features: ['basic'],
        maxMembers: 10,
        maxBranches: 1,
      })
    }
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('Fluxo Completo: Registro → Login → Criar Igreja → Login Novamente', () => {
    it('deve completar fluxo completo validando novo modelo', async () => {
      // Given - Estado inicial: usuário novo sem Member
      const timestamp = Date.now()
      const email = `e2e-${timestamp}@test.com`

      // When - Passo 1: Registrar novo usuário (cria apenas User)
      const registerResponse = await request(app.server)
        .post('/public/register')
        .send({
          firstName: 'Usuário',
          lastName: `E2E ${timestamp}`,
          email,
          password: 'senha123456',
          phone: '11999999999',
          document: '12345678901', // CPF padrão para testes (11 dígitos)
        })

      // Then - Validação de registro
      expect(registerResponse.status).toBe(201)
      expect(registerResponse.body.user).toBeDefined()
      expect(registerResponse.body.token).toBeDefined()

      const registerToken = registerResponse.body.token
      const decodedRegister = jwt.decode(registerToken) as any
      
      // Then - Token de registro deve ter type: 'user' (sem Member ainda)
      expect(decodedRegister.type).toBe('user')
      expect(decodedRegister.memberId).toBeUndefined()
      expect(decodedRegister.role).toBeUndefined()
      expect(decodedRegister.branchId).toBeUndefined()
      expect(decodedRegister.permissions).toEqual([])

      // When - Passo 2: Fazer login (ainda sem Member)
      const loginBeforeChurch = await request(app.server)
        .post('/auth/login')
        .send({
          email,
          password: 'senha123456',
        })

      // Then - Validação de login sem Member
      expect(loginBeforeChurch.status).toBe(200)
      expect(loginBeforeChurch.body.type).toBe('user')
      expect(loginBeforeChurch.body.user.memberId).toBeUndefined()
      expect(loginBeforeChurch.body.user.role).toBeUndefined()
      expect(loginBeforeChurch.body.user.branchId).toBeUndefined()

      // When - Passo 3: Criar igreja (cria Member associado ao User)
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${registerToken}`)
        .send({
          name: `Igreja E2E ${timestamp}`,
          branchName: 'Sede',
          withBranch: true,
        })

      // Then - Validação de criação de igreja
      expect(churchResponse.status).toBe(201)
      expect(churchResponse.body.church).toBeDefined()
      expect(churchResponse.body.member).toBeDefined()
      expect(churchResponse.body.token).toBeDefined()

      const newToken = churchResponse.body.token
      const decodedNewToken = jwt.decode(newToken) as any

      // Then - Token após criar igreja deve ter contexto de Member
      expect(decodedNewToken.type).toBe('member')
      expect(decodedNewToken.memberId).toBeDefined()
      expect(decodedNewToken.role).toBe('ADMINGERAL')
      expect(decodedNewToken.branchId).toBeDefined()
      expect(decodedNewToken.churchId).toBeDefined()

      // When - Passo 4: Fazer login novamente (agora com Member)
      const loginAfterChurch = await request(app.server)
        .post('/auth/login')
        .send({
          email,
          password: 'senha123456', // Mesma senha do User
        })

      // Then - Validação de login com Member
      expect(loginAfterChurch.status).toBe(200)
      expect(loginAfterChurch.body.type).toBe('member')
      expect(loginAfterChurch.body.user.memberId).toBeDefined()
      expect(loginAfterChurch.body.user.role).toBe('ADMINGERAL')
      expect(loginAfterChurch.body.user.branchId).toBeDefined()
      expect(loginAfterChurch.body.user.churchId).toBeDefined()
      expect(loginAfterChurch.body.user.permissions).toBeDefined()
      expect(Array.isArray(loginAfterChurch.body.user.permissions)).toBe(true)

      // Then - Verificação de estado final no banco
      const member = await prisma.member.findUnique({
        where: { email },
        include: { User: true },
      })

      expect(member).toBeDefined()
      expect(member?.User).toBeDefined()
      expect(member?.userId).toBe(member?.User?.id)

      // Then - Verifica que coluna password não existe no modelo Member
      const passwordColumn = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Member' AND column_name = 'password'
      `
      expect(Array.isArray(passwordColumn)).toBe(true)
      expect((passwordColumn as any[]).length).toBe(0)
    })
  })
})

