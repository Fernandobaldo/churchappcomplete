// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

// Força o NODE_ENV para test antes de importar qualquer coisa
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import request from 'supertest'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { seedTestDatabase } from '../utils/seedTestDatabase'
import { debugSeed } from '../utils/debugSeed'
import { authenticate } from '../../src/middlewares/authenticate'



describe('Auth Routes - /auth/login', () => {
  const app = Fastify()

  let testData: Awaited<ReturnType<typeof seedTestDatabase>>

  beforeAll(async () => {
    app.register(fastifyJwt, {
         secret: 'churchapp-secret-key',
       })

       // Usa o middleware authenticate do projeto que popula request.user corretamente
       app.decorate('authenticate', authenticate)

       // Registra todas as rotas da aplicação
       await registerRoutes(app)
       await app.ready()

    await resetTestDatabase()
    testData = await seedTestDatabase()
    
    // Debug: verificar se os dados foram criados
    await debugSeed()
    
    // Força uma nova conexão para garantir que estamos usando a mesma instância
    // O Prisma Client faz commit automático, mas garantimos que a conexão está ativa
    try {
      await prisma.$connect()
    } catch (error) {
      // Já está conectado, ignora
    }
    
    // Aguarda um pouco para garantir que as transações foram commitadas
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Verifica novamente se os dados estão acessíveis usando a mesma instância do Prisma
    console.log('[TEST] Verificando dados após seed...')
    console.log('[TEST] Prisma Client instance ID:', (prisma as any).$internalEngine?.instanceId || 'N/A')
    
    // Lista todos os users e members para debug
    const allUsers = await prisma.user.findMany({ select: { email: true } })
    const allMembers = await prisma.member.findMany({ select: { email: true } })
    console.log('[TEST] Users no banco:', allUsers.map(u => u.email))
    console.log('[TEST] Members no banco:', allMembers.map(m => m.email))
    
    const verifyUser = await prisma.user.findUnique({ where: { email: 'user@example.com' } })
    const verifyMember = await prisma.member.findUnique({ where: { email: 'member@example.com' } })
    console.log('[TEST] User verificado:', verifyUser ? '✅' : '❌')
    console.log('[TEST] Member verificado:', verifyMember ? '✅' : '❌')
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  it('deve fazer login com member válido e retornar token com contexto de Member', async () => {
    // Debug: Verificar se o Member existe no banco antes do teste
    const memberUser = await prisma.user.findUnique({
      where: { email: 'member@example.com' },
      include: { Member: true },
    })
    console.log('[TEST] User do Member antes do login:', {
      id: memberUser?.id,
      email: memberUser?.email,
      hasMember: !!memberUser?.Member,
      memberId: memberUser?.Member?.id,
      memberUserId: memberUser?.Member?.userId,
    })

    const response = await request(app.server)
      .post('/auth/login')
      .send({ email: 'member@example.com', password: 'password123' })

    // Debug apenas se necessário
    if (process.env.DEBUG_TEST) {
      console.log('[TEST] Response body:', JSON.stringify(response.body, null, 2))
      console.log('[TEST] Response body.user keys:', Object.keys(response.body.user || {}))
    }

    expect(response.status).toBe(200)
    expect(response.body.token).toBeDefined()
    expect(response.body.user.email).toBe('member@example.com')
    expect(response.body.type).toBe('member')
    expect(response.body.user.password).toBeUndefined() // segurança
    
    // NOVO MODELO: Token deve conter contexto de Member
    expect(response.body.user.memberId).toBeDefined()
    expect(response.body.user.role).toBeDefined()
    expect(response.body.user.branchId).toBeDefined()
    expect(response.body.user.permissions).toBeDefined()
    expect(Array.isArray(response.body.user.permissions)).toBe(true)
  })

  it('deve fazer login com user válido (sem Member) e retornar token sem contexto de Member', async () => {
    const response = await request(app.server)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })

    expect(response.status).toBe(200)
    expect(response.body.token).toBeDefined()
    expect(response.body.user.email).toBe('user@example.com')
    expect(response.body.type).toBe('user')
    expect(response.body.user.password).toBeUndefined()
    
    // NOVO MODELO: User sem Member não deve ter contexto de Member
    expect(response.body.user.memberId).toBeUndefined()
    expect(response.body.user.role).toBeUndefined()
    expect(response.body.user.branchId).toBeUndefined()
  })

  it('deve retornar 401 se o email não existir', async () => {
    const response = await request(app.server)
      .post('/auth/login')
      .send({ email: 'notfound@example.com', password: 'password123' })

    expect(response.status).toBe(401)
    expect(response.body.message).toContain('Credenciais inválidas')
  })

  it('deve retornar 401 se a senha estiver incorreta', async () => {
    const response = await request(app.server)
      .post('/auth/login')
      .send({ email: 'juliet@example.com', password: 'wrongpassword' })

    expect(response.status).toBe(401)
    expect(response.body.message).toContain('Credenciais inválidas')
  })

  it('deve retornar 400 se os campos obrigatórios estiverem ausentes', async () => {
    const response = await request(app.server)
      .post('/auth/login')
      .send({}) // sem email e senha

    expect(response.status).toBe(400)
    expect(response.body.message).toBeDefined()
  })
})
