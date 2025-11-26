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
import jwt from 'jsonwebtoken'
import { authenticate } from '../../src/middlewares/authenticate'

describe('E2E: Novo Modelo User + Member', () => {
  const app = Fastify()
  const JWT_SECRET = 'churchapp-secret-key'

  beforeAll(async () => {
    app.register(fastifyJwt, {
      secret: JWT_SECRET,
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
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('Fluxo Completo: Registro → Login → Criar Igreja → Login Novamente', () => {
    it('deve completar fluxo completo validando novo modelo', async () => {
      const timestamp = Date.now()
      const email = `e2e-${timestamp}@test.com`

      // PASSO 1: Registrar novo usuário (cria apenas User)
      console.log('[E2E] 📝 Passo 1: Registrando novo usuário...')
      const registerResponse = await request(app.server)
        .post('/public/register')
        .send({
          name: `Usuário E2E ${timestamp}`,
          email,
          password: 'senha123456',
        })

      expect(registerResponse.status).toBe(201)
      expect(registerResponse.body.user).toBeDefined()
      expect(registerResponse.body.token).toBeDefined()

      const registerToken = registerResponse.body.token
      const decodedRegister = jwt.decode(registerToken) as any
      
      // Token de registro deve ter type: 'user' (sem Member ainda)
      expect(decodedRegister.type).toBe('user')
      // Campos de Member devem ser undefined (omitidos) quando não há Member
      // Isso indica que o onboarding não foi completado
      expect(decodedRegister.memberId).toBeUndefined()
      expect(decodedRegister.role).toBeUndefined()
      expect(decodedRegister.branchId).toBeUndefined()
      expect(decodedRegister.permissions).toEqual([])

      console.log('[E2E] ✅ Usuário registrado:', registerResponse.body.user.id)

      // PASSO 2: Fazer login (ainda sem Member)
      console.log('[E2E] 🔐 Passo 2: Fazendo login (sem Member)...')
      const loginBeforeChurch = await request(app.server)
        .post('/auth/login')
        .send({
          email,
          password: 'senha123456',
        })

      expect(loginBeforeChurch.status).toBe(200)
      expect(loginBeforeChurch.body.type).toBe('user')
      expect(loginBeforeChurch.body.user.memberId).toBeUndefined()
      expect(loginBeforeChurch.body.user.role).toBeUndefined()
      expect(loginBeforeChurch.body.user.branchId).toBeUndefined()

      console.log('[E2E] ✅ Login sem Member realizado')

      // PASSO 3: Criar igreja (cria Member associado ao User)
      console.log('[E2E] 🏛️ Passo 3: Criando igreja...')
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${registerToken}`)
        .send({
          name: `Igreja E2E ${timestamp}`,
          branchName: 'Sede',
          withBranch: true,
        })

      expect(churchResponse.status).toBe(201)
      expect(churchResponse.body.church).toBeDefined()
      expect(churchResponse.body.member).toBeDefined()
      expect(churchResponse.body.token).toBeDefined() // Token atualizado

      const newToken = churchResponse.body.token
      const decodedNewToken = jwt.decode(newToken) as any

      // Token após criar igreja deve ter contexto de Member
      expect(decodedNewToken.type).toBe('member')
      expect(decodedNewToken.memberId).toBeDefined()
      expect(decodedNewToken.role).toBe('ADMINGERAL')
      expect(decodedNewToken.branchId).toBeDefined()
      expect(decodedNewToken.churchId).toBeDefined()

      console.log('[E2E] ✅ Igreja criada, Member associado ao User')

      // PASSO 4: Fazer login novamente (agora com Member)
      console.log('[E2E] 🔐 Passo 4: Fazendo login novamente (com Member)...')
      const loginAfterChurch = await request(app.server)
        .post('/auth/login')
        .send({
          email,
          password: 'senha123456', // Mesma senha do User
        })

      expect(loginAfterChurch.status).toBe(200)
      expect(loginAfterChurch.body.type).toBe('member') // Agora é member
      expect(loginAfterChurch.body.user.memberId).toBeDefined()
      expect(loginAfterChurch.body.user.role).toBe('ADMINGERAL')
      expect(loginAfterChurch.body.user.branchId).toBeDefined()
      expect(loginAfterChurch.body.user.churchId).toBeDefined()
      expect(loginAfterChurch.body.user.permissions).toBeDefined()
      expect(Array.isArray(loginAfterChurch.body.user.permissions)).toBe(true)

      console.log('[E2E] ✅ Login com Member realizado')

      // PASSO 5: Verificar que Member não tem senha no banco
      console.log('[E2E] 🔍 Passo 5: Verificando que Member não tem senha...')
      const member = await prisma.member.findUnique({
        where: { email },
        include: { User: true },
      })

      expect(member).toBeDefined()
      expect(member?.User).toBeDefined()
      expect(member?.userId).toBe(member?.User?.id)

      // Verifica que coluna password não existe mais
      const passwordColumn = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Member' AND column_name = 'password'
      `
      expect(Array.isArray(passwordColumn)).toBe(true)
      expect((passwordColumn as any[]).length).toBe(0)

      console.log('[E2E] ✅ Verificação concluída: Member não tem senha, usa senha do User')
    })
  })
})

