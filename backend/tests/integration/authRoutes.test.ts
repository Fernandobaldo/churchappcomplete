import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import request from 'supertest'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { seedTestDatabase } from '../utils/seedTestDatabase'



describe('Auth Routes - /auth/login', () => {
  const app = Fastify()

  let testData: Awaited<ReturnType<typeof seedTestDatabase>>

  beforeAll(async () => {
    app.register(fastifyJwt, {
         secret: 'churchapp-secret-key',
       })

       // Decora método de autenticação
       app.decorate('authenticate', async function (request, reply) {
         try {
           await request.jwtVerify()
         } catch (err) {
           return reply.status(401).send({ message: 'Token inválido' })
         }
       })

       // Registra todas as rotas da aplicação
       await registerRoutes(app)
       await app.ready()

    await resetTestDatabase()
    testData = await seedTestDatabase()
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  it('deve fazer login com member válido e retornar token', async () => {
    const response = await request(app.server)
      .post('/auth/login')
      .send({ email: 'member@example.com', password: 'password123' })

    expect(response.status).toBe(200)
    expect(response.body.token).toBeDefined()
    expect(response.body.user.email).toBe('member@example.com')
    expect(response.body.type).toBe('member')
    expect(response.body.user.password).toBeUndefined() // segurança
  })

  it('deve fazer login com user válido e retornar token', async () => {
    const response = await request(app.server)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })

    expect(response.status).toBe(200)
    expect(response.body.token).toBeDefined()
    expect(response.body.user.email).toBe('user@example.com')
    expect(response.body.type).toBe('user')
    expect(response.body.user.password).toBeUndefined()
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
