import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { authenticate } from '../../src/middlewares/authenticate'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Upload Routes', () => {
  const app = Fastify()
  let userToken: string
  let userId: string
  let memberId: string
  let churchId: string
  let branchId: string

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'churchapp-secret-key'
    }

    app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'churchapp-secret-key',
    })

    app.register(fastifyStatic, {
      root: path.join(__dirname, '../../uploads'),
      prefix: '/uploads/',
    })

    app.decorate('authenticate', authenticate)

    // registerRoutes já registra uploadRoutes que por sua vez registra fastifyMultipart
    await registerRoutes(app)
    await app.ready()

    await resetTestDatabase()

    // Criar plano
    await prisma.plan.findFirst({ where: { name: 'Free Plan' } }) || 
      await prisma.plan.create({
        data: {
          name: 'Free Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 10,
          maxBranches: 1,
        },
      })

    // Criar igreja
    const church = await prisma.church.create({
      data: {
        name: 'Igreja Teste',
      },
    })
    churchId = church.id

    // Criar filial
    const branch = await prisma.branch.create({
      data: {
        name: 'Filial Teste',
        churchId: church.id,
      },
    })
    branchId = branch.id

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
      },
    })
    userId = user.id

    // Criar membro
    const member = await prisma.member.create({
      data: {
        name: 'Test Member',
        email: 'member@example.com',
        branchId: branch.id,
        role: 'ADMINGERAL',
        userId: user.id,
      },
      include: { Permission: true },
    })
    memberId = member.id

    // Gerar token
    userToken = app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'user',
      memberId: member.id,
      role: member.role,
      branchId: member.branchId,
      churchId: church.id,
      permissions: member.Permission.map(p => p.type),
    })

    // Garantir que o diretório de uploads existe
    const uploadDir = path.join(__dirname, '../../uploads/avatars')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Diretório já existe
    }
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /upload/avatar', () => {
    it('deve fazer upload de avatar com sucesso', async () => {
      // Criar um arquivo de imagem fake (PNG válido)
      const imageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )

      const response = await request(app.server)
        .post('/upload/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', imageBuffer, 'test.png')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('url')
      expect(response.body.url).toMatch(/^\/uploads\/avatars\/.+/)
    })

    it('deve retornar 401 quando não autenticado', async () => {
      const imageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )

      const response = await request(app.server)
        .post('/upload/avatar')
        .attach('file', imageBuffer, 'test.png')

      expect(response.status).toBe(401)
    })

    it('deve retornar 400 quando nenhum arquivo é enviado', async () => {
      const response = await request(app.server)
        .post('/upload/avatar')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(400)
    })

    it('deve retornar 400 quando arquivo é muito grande', async () => {
      // Criar um arquivo maior que 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB

      const response = await request(app.server)
        .post('/upload/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', largeBuffer, 'large.png')

      // Pode retornar 400 ou 413 (Payload Too Large)
      expect([400, 413]).toContain(response.status)
    })
  })
})

