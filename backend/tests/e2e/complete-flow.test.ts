// tests/e2e/complete-flow.test.ts
// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

// Força o NODE_ENV para test antes de importar qualquer coisa
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

// Importa o setup do ambiente de teste (garante que o banco está sincronizado)
import '../setupTestEnv'

import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { prisma } from '../../src/lib/prisma'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { authenticate } from '../../src/middlewares/authenticate'
import {
  registerUser,
  loginUser,
  createChurch,
  createEvent,
  createContribution,
  setupCompleteUser,
} from './helpers/testHelpers'
import { format } from 'date-fns'

describe('E2E: Fluxo Completo - Registro até Contribuição', () => {
  const app = Fastify()

  beforeAll(async () => {
    // Garante que o banco está sincronizado
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada no .env.test')
    }

    // Verifica se as tabelas existem, se não, cria
    try {
      await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`
      console.log('[E2E] ✅ Tabelas já existem no banco de teste')
    } catch (error: any) {
      console.log('[E2E] ⚠️ Tabelas não existem, criando schema...')
      const cleanDatabaseUrl = databaseUrl.replace(/^["']|["']$/g, '')
      try {
        execSync(
          'npx prisma db push --force-reset --skip-generate --schema=prisma/schema.prisma --accept-data-loss',
          {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: cleanDatabaseUrl },
          }
        )
        console.log('[E2E] ✅ Schema criado com sucesso')
      } catch (err: any) {
        console.error('[E2E] ❌ Erro ao criar schema:', err.message)
        throw new Error(
          `Falha ao inicializar banco de teste. Verifique se o PostgreSQL está rodando e se a DATABASE_URL está correta. Erro: ${err.message}`
        )
      }
    }

    // Configura JWT
    app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'churchapp-secret-key',
    })

    // Usa o middleware authenticate do projeto que popula request.user corretamente
    app.decorate('authenticate', authenticate)

    // Registra todas as rotas da aplicação
    await registerRoutes(app)
    await app.ready()

    // Limpa e prepara o banco de dados
    await resetTestDatabase()

    // Cria o plano gratuito (necessário para registro de usuários)
    const existingPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { name: 'free' },
          { name: 'Free' },
          { name: 'Free Plan' },
        ],
      },
    })

    if (!existingPlan) {
      await prisma.plan.create({
        data: {
          name: 'free',
          price: 0,
          features: [
            'Até 1 igreja',
            'Até 1 filial',
            'Até 20 membros',
            'Painel de controle limitado',
          ],
          maxBranches: 1,
          maxMembers: 20,
        },
      })
      console.log('[E2E] ✅ Plano Free criado')
    } else {
      console.log(`[E2E] ℹ️ Plano Free já existe (nome: "${existingPlan.name}")`)
    }
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('Cenário 1: Fluxo completo desde o registro', () => {
    it('deve completar todo o fluxo: registro → igreja → evento → contribuição', async () => {
      const timestamp = Date.now()
      const userEmail = `e2e-user-${timestamp}@test.com`
      const userName = `Usuário E2E ${timestamp}`

      // PASSO 1: Registrar novo usuário
      console.log('[E2E] 📝 Passo 1: Registrando novo usuário...')
      const registerResult = await registerUser(app, {
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      expect(registerResult.user).toBeDefined()
      expect(registerResult.user.email).toBe(userEmail)
      expect(registerResult.token).toBeDefined()
      console.log('[E2E] ✅ Usuário registrado:', registerResult.user.id)

      // PASSO 2: Criar igreja (isso também cria member e branch)
      console.log('[E2E] 🏛️ Passo 2: Criando igreja...')
      const churchResult = await createChurch(app, registerResult.token, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      expect(churchResult.church || churchResult).toBeDefined()
      const churchId = churchResult.church?.id || churchResult.id
      const branchId = churchResult.branch?.id
      const memberId = churchResult.member?.id
      const memberToken = churchResult.newToken // Token atualizado com dados do member

      expect(churchId).toBeDefined()
      expect(branchId).toBeDefined()
      expect(memberId).toBeDefined()
      expect(memberToken).toBeDefined()
      console.log('[E2E] ✅ Igreja criada:', churchId)
      console.log('[E2E] ✅ Filial criada:', branchId)
      console.log('[E2E] ✅ Member criado:', memberId)
      console.log('[E2E] ✅ Token atualizado recebido')

      // PASSO 3: Criar evento (usa o token atualizado com dados do member)
      console.log('[E2E] 📅 Passo 3: Criando evento...')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      const eventResult = await createEvent(app, memberToken, {
        title: `Evento E2E ${timestamp}`,
        startDate: format(tomorrow, 'dd/MM/yyyy'),
        endDate: format(dayAfterTomorrow, 'dd/MM/yyyy'),
        time: '19:00',
        location: 'Igreja Central',
        description: 'Evento criado via teste E2E',
        hasDonation: true,
        donationReason: 'Obra missionária',
        donationLink: 'https://example.com/doacao',
      })

      expect(eventResult.id).toBeDefined()
      expect(eventResult.title).toBe(`Evento E2E ${timestamp}`)
      expect(eventResult.branchId).toBe(branchId)
      console.log('[E2E] ✅ Evento criado:', eventResult.id)

      // PASSO 4: Criar contribuição (usa o token atualizado com dados do member)
      console.log('[E2E] 💰 Passo 4: Criando contribuição...')
      const contributionResult = await createContribution(
        app,
        memberToken,
        {
          title: `Contribuição E2E ${timestamp}`,
          description: 'Contribuição criada via teste E2E',
          value: 150.50,
          date: new Date().toISOString(),
          type: 'DIZIMO',
        }
      )

      expect(contributionResult.id).toBeDefined()
      expect(contributionResult.title).toBe(`Contribuição E2E ${timestamp}`)
      expect(contributionResult.value).toBe(150.50)
      expect(contributionResult.type).toBe('DIZIMO')
      expect(contributionResult.branchId).toBe(branchId)
      console.log('[E2E] ✅ Contribuição criada:', contributionResult.id)

      // Verificação final: todos os dados foram criados corretamente
      console.log('[E2E] 🔍 Verificando dados no banco...')

      const userInDb = await prisma.user.findUnique({
        where: { email: userEmail },
      })
      expect(userInDb).toBeDefined()

      const churchInDb = await prisma.church.findUnique({
        where: { id: churchId },
      })
      expect(churchInDb).toBeDefined()

      const branchInDb = await prisma.branch.findUnique({
        where: { id: branchId },
      })
      expect(branchInDb).toBeDefined()
      expect(branchInDb?.churchId).toBe(churchId)

      const memberInDb = await prisma.member.findUnique({
        where: { id: memberId },
      })
      expect(memberInDb).toBeDefined()
      expect(memberInDb?.branchId).toBe(branchId)

      const eventInDb = await prisma.event.findUnique({
        where: { id: eventResult.id },
      })
      expect(eventInDb).toBeDefined()
      expect(eventInDb?.branchId).toBe(branchId)

      const contributionInDb = await prisma.contribution.findUnique({
        where: { id: contributionResult.id },
      })
      expect(contributionInDb).toBeDefined()
      expect(contributionInDb?.branchId).toBe(branchId)

      console.log('[E2E] ✅ Todos os dados verificados no banco!')
    })
  })

  describe('Cenário 2: Fluxo com login após registro', () => {
    it('deve fazer login após registro e criar recursos', async () => {
      const timestamp = Date.now()
      const userEmail = `e2e-login-${timestamp}@test.com`
      const userName = `Usuário Login E2E ${timestamp}`

      // PASSO 1: Registrar
      console.log('[E2E] 📝 Registrando usuário...')
      const registerResult = await registerUser(app, {
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      // PASSO 2: Fazer login (simula logout/login)
      console.log('[E2E] 🔐 Fazendo login...')
      const loginResult = await loginUser(app, {
        email: userEmail,
        password: 'senha123456',
      })

      expect(loginResult.token).toBeDefined()
      expect(loginResult.user.email).toBe(userEmail)
      expect(loginResult.type).toBe('user') // Usuário recém-registrado é do tipo 'user'

      // PASSO 3: Criar igreja
      console.log('[E2E] 🏛️ Criando igreja...')
      const churchResult = await createChurch(app, loginResult.token, {
        name: `Igreja Login E2E ${timestamp}`,
        branchName: 'Sede',
      })

      expect(churchResult.church || churchResult).toBeDefined()
      const memberToken = churchResult.newToken // Token atualizado com dados do member

      // PASSO 4: Criar evento (usa o token atualizado com dados do member)
      console.log('[E2E] 📅 Criando evento...')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const eventResult = await createEvent(app, memberToken, {
        title: `Evento Login E2E ${timestamp}`,
        startDate: format(tomorrow, 'dd/MM/yyyy'),
        endDate: format(tomorrow, 'dd/MM/yyyy'),
        location: 'Igreja Central',
        description: 'Evento após login',
      })

      expect(eventResult.id).toBeDefined()

      console.log('[E2E] ✅ Fluxo com login concluído!')
    })
  })

  describe('Cenário 3: Múltiplos eventos e contribuições', () => {
    it('deve criar múltiplos eventos e contribuições para o mesmo usuário', async () => {
      const timestamp = Date.now()
      const userEmail = `e2e-multiple-${timestamp}@test.com`

      // Setup completo: registro + igreja
      const auth = await setupCompleteUser(
        app,
        {
          name: `Usuário Múltiplo ${timestamp}`,
          email: userEmail,
          password: 'senha123456',
        },
        {
          name: `Igreja Múltipla ${timestamp}`,
          branchName: 'Sede',
        }
      )

      expect(auth.branchId).toBeDefined()

      // Criar 3 eventos
      console.log('[E2E] 📅 Criando múltiplos eventos...')
      const events = []
      for (let i = 1; i <= 3; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)

        const event = await createEvent(app, auth.token, {
          title: `Evento ${i} - E2E ${timestamp}`,
          startDate: format(date, 'dd/MM/yyyy'),
          endDate: format(date, 'dd/MM/yyyy'),
          location: `Local ${i}`,
          description: `Evento número ${i}`,
        })

        events.push(event)
        expect(event.id).toBeDefined()
      }

      expect(events).toHaveLength(3)

      // Criar 3 contribuições
      console.log('[E2E] 💰 Criando múltiplas contribuições...')
      const contributions = []
      const types: Array<'DIZIMO' | 'OFERTA' | 'OUTRO'> = [
        'DIZIMO',
        'OFERTA',
        'OUTRO',
      ]

      for (let i = 0; i < 3; i++) {
        const contribution = await createContribution(app, auth.token, {
          title: `Contribuição ${i + 1} - E2E ${timestamp}`,
          value: (i + 1) * 100,
          date: new Date().toISOString(),
          type: types[i],
        })

        contributions.push(contribution)
        expect(contribution.id).toBeDefined()
        expect(contribution.type).toBe(types[i])
      }

      expect(contributions).toHaveLength(3)

      // Verificar que todos foram criados na mesma branch
      const allEvents = await prisma.event.findMany({
        where: { branchId: auth.branchId },
      })
      expect(allEvents.length).toBeGreaterThanOrEqual(3)

      const allContributions = await prisma.contribution.findMany({
        where: { branchId: auth.branchId },
      })
      expect(allContributions.length).toBeGreaterThanOrEqual(3)

      console.log('[E2E] ✅ Múltiplos recursos criados com sucesso!')
    })
  })

  describe('Cenário 4: Validações e erros', () => {
    it('deve validar campos obrigatórios ao criar evento', async () => {
      const timestamp = Date.now()
      const auth = await setupCompleteUser(
        app,
        {
          name: `Usuário Validação ${timestamp}`,
          email: `e2e-validation-${timestamp}@test.com`,
          password: 'senha123456',
        },
        {
          name: `Igreja Validação ${timestamp}`,
        }
      )

      // Tentar criar evento sem título (deve falhar)
      const response = await app.inject({
        method: 'POST',
        url: '/events',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
        payload: {
          startDate: format(new Date(), 'dd/MM/yyyy'),
          endDate: format(new Date(), 'dd/MM/yyyy'),
          // título ausente
        },
      })

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })

    it('deve validar campos obrigatórios ao criar contribuição', async () => {
      const timestamp = Date.now()
      const auth = await setupCompleteUser(
        app,
        {
          name: `Usuário Validação 2 ${timestamp}`,
          email: `e2e-validation2-${timestamp}@test.com`,
          password: 'senha123456',
        },
        {
          name: `Igreja Validação 2 ${timestamp}`,
        }
      )

      // Tentar criar contribuição sem valor (deve falhar)
      const response = await app.inject({
        method: 'POST',
        url: '/contributions',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
        payload: {
          title: 'Contribuição sem valor',
          date: new Date().toISOString(),
          type: 'DIZIMO',
          // valor ausente
        },
      })

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })
  })
})

