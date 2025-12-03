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
  createTransaction,
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
          title: `Campanha E2E ${timestamp}`,
          description: 'Campanha criada via teste E2E',
          goal: 15000.50,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          paymentMethods: [
            {
              type: 'PIX',
              data: { chave: '12345678900' },
            },
          ],
        }
      )

      expect(contributionResult.id).toBeDefined()
      expect(contributionResult.title).toBe(`Campanha E2E ${timestamp}`)
      expect(contributionResult.goal).toBe(15000.50)
      expect(contributionResult.isActive).toBe(true)
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
      for (let i = 0; i < 3; i++) {
        const contribution = await createContribution(app, auth.token, {
          title: `Campanha ${i + 1} - E2E ${timestamp}`,
          goal: (i + 1) * 1000,
          isActive: true,
          paymentMethods: [
            {
              type: 'PIX',
              data: { chave: `1234567890${i}` },
            },
          ],
        })

        contributions.push(contribution)
        expect(contribution.id).toBeDefined()
        expect(contribution.goal).toBe((i + 1) * 1000)
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

      // Tentar criar campanha de contribuição sem título (deve falhar)
      // O modelo atual de Contribution é uma campanha, não uma contribuição individual
      // O único campo obrigatório é 'title'
      const response = await app.inject({
        method: 'POST',
        url: '/contributions',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
        payload: {
          description: 'Campanha sem título',
          // title ausente (campo obrigatório)
        },
      })

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })

    it('deve validar campos obrigatórios ao criar transação financeira', async () => {
      const timestamp = Date.now()
      const auth = await setupCompleteUser(
        app,
        {
          name: `Usuário Validação Finance ${timestamp}`,
          email: `e2e-validation-finance-${timestamp}@test.com`,
          password: 'senha123456',
        },
        {
          name: `Igreja Validação Finance ${timestamp}`,
        }
      )

      // Tentar criar transação ENTRY sem entryType (deve falhar)
      const response = await app.inject({
        method: 'POST',
        url: '/finances',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
        payload: {
          title: 'Transação sem entryType',
          amount: 100.0,
          type: 'ENTRY',
          // entryType ausente
        },
      })

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Cenário 5: Fluxo completo com transações financeiras', () => {
    it('deve completar fluxo: registro → igreja → transações financeiras', async () => {
      const timestamp = Date.now()
      const userEmail = `e2e-finance-${timestamp}@test.com`
      const userName = `Usuário Finance E2E ${timestamp}`

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
        name: `Igreja Finance E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      expect(churchResult.church || churchResult).toBeDefined()
      const churchId = churchResult.church?.id || churchResult.id
      const branchId = churchResult.branch?.id
      const memberId = churchResult.member?.id
      const memberToken = churchResult.newToken

      expect(churchId).toBeDefined()
      expect(branchId).toBeDefined()
      expect(memberId).toBeDefined()
      expect(memberToken).toBeDefined()
      console.log('[E2E] ✅ Igreja criada:', churchId)
      console.log('[E2E] ✅ Filial criada:', branchId)
      console.log('[E2E] ✅ Member criado:', memberId)

      // PASSO 3: Criar transação de entrada (Oferta)
      console.log('[E2E] 💰 Passo 3: Criando transação de oferta...')
      const offerTransaction = await createTransaction(app, memberToken, {
        title: `Oferta E2E ${timestamp}`,
        amount: 500.0,
        type: 'ENTRY',
        entryType: 'OFERTA',
        category: 'Oferta',
      })

      expect(offerTransaction.id).toBeDefined()
      expect(offerTransaction.title).toBe(`Oferta E2E ${timestamp}`)
      expect(offerTransaction.amount).toBe(500.0)
      expect(offerTransaction.type).toBe('ENTRY')
      expect(offerTransaction.entryType).toBe('OFERTA')
      expect(offerTransaction.branchId).toBe(branchId)
      console.log('[E2E] ✅ Oferta criada:', offerTransaction.id)

      // PASSO 4: Criar transação de entrada (Dízimo com dizimista não membro)
      console.log('[E2E] 💰 Passo 4: Criando transação de dízimo...')
      const titheTransaction = await createTransaction(app, memberToken, {
        title: `Dízimo E2E ${timestamp}`,
        amount: 1000.0,
        type: 'ENTRY',
        entryType: 'DIZIMO',
        category: 'Dízimo',
        tithePayerName: 'Visitante Teste',
        isTithePayerMember: false,
      })

      expect(titheTransaction.id).toBeDefined()
      expect(titheTransaction.title).toBe(`Dízimo E2E ${timestamp}`)
      expect(titheTransaction.amount).toBe(1000.0)
      expect(titheTransaction.type).toBe('ENTRY')
      expect(titheTransaction.entryType).toBe('DIZIMO')
      expect(titheTransaction.tithePayerName).toBe('Visitante Teste')
      expect(titheTransaction.isTithePayerMember).toBe(false)
      console.log('[E2E] ✅ Dízimo criado:', titheTransaction.id)

      // PASSO 5: Criar transação de saída
      console.log('[E2E] 💰 Passo 5: Criando transação de saída...')
      const exitTransaction = await createTransaction(app, memberToken, {
        title: `Pagamento E2E ${timestamp}`,
        amount: 300.0,
        type: 'EXIT',
        category: 'Despesas',
        exitType: 'ALUGUEL',
      })

      expect(exitTransaction.id).toBeDefined()
      expect(exitTransaction.title).toBe(`Pagamento E2E ${timestamp}`)
      expect(exitTransaction.amount).toBe(300.0)
      expect(exitTransaction.type).toBe('EXIT')
      expect(exitTransaction.branchId).toBe(branchId)
      console.log('[E2E] ✅ Pagamento criado:', exitTransaction.id)

      // PASSO 6: Verificar resumo financeiro
      console.log('[E2E] 📊 Passo 6: Verificando resumo financeiro...')
      const summaryResponse = await app.inject({
        method: 'GET',
        url: '/finances',
        headers: {
          authorization: `Bearer ${memberToken}`,
        },
      })

      expect(summaryResponse.statusCode).toBe(200)
      const summaryData = JSON.parse(summaryResponse.body)
      expect(summaryData).toHaveProperty('transactions')
      expect(summaryData).toHaveProperty('summary')
      expect(summaryData.transactions.length).toBeGreaterThanOrEqual(3)
      expect(summaryData.summary.entries).toBe(1500.0) // 500 (oferta) + 1000 (dízimo)
      expect(summaryData.summary.exits).toBe(300.0)
      expect(summaryData.summary.total).toBe(1200.0) // 1500 - 300
      console.log('[E2E] ✅ Resumo financeiro verificado!')

      // Verificação final: todos os dados foram criados corretamente
      console.log('[E2E] 🔍 Verificando dados no banco...')

      const transactionsInDb = await prisma.transaction.findMany({
        where: { branchId: branchId },
      })
      expect(transactionsInDb.length).toBeGreaterThanOrEqual(3)

      const offerInDb = transactionsInDb.find((t) => t.id === offerTransaction.id)
      expect(offerInDb).toBeDefined()
      expect(offerInDb?.type).toBe('ENTRY')
      expect(offerInDb?.entryType).toBe('OFERTA')

      const titheInDb = transactionsInDb.find((t) => t.id === titheTransaction.id)
      expect(titheInDb).toBeDefined()
      expect(titheInDb?.type).toBe('ENTRY')
      expect(titheInDb?.entryType).toBe('DIZIMO')
      expect(titheInDb?.tithePayerName).toBe('Visitante Teste')

      const exitInDb = transactionsInDb.find((t) => t.id === exitTransaction.id)
      expect(exitInDb).toBeDefined()
      expect(exitInDb?.type).toBe('EXIT')

      console.log('[E2E] ✅ Todos os dados verificados no banco!')
    })

    it('deve criar múltiplas transações e calcular resumo correto', async () => {
      const timestamp = Date.now()
      const auth = await setupCompleteUser(
        app,
        {
          name: `Usuário Múltiplas Transações ${timestamp}`,
          email: `e2e-multiple-transactions-${timestamp}@test.com`,
          password: 'senha123456',
        },
        {
          name: `Igreja Múltiplas Transações ${timestamp}`,
        }
      )

      expect(auth.branchId).toBeDefined()

      // Criar 5 transações de entrada
      console.log('[E2E] 💰 Criando múltiplas transações de entrada...')
      const entries = []
      for (let i = 1; i <= 5; i++) {
        const isDizimo = i % 2 !== 0 // Ímpares são dízimo
        const transactionData: any = {
          title: `Entrada ${i} - E2E ${timestamp}`,
          amount: i * 100,
          type: 'ENTRY',
          entryType: isDizimo ? 'DIZIMO' : 'OFERTA',
          category: `Categoria ${i}`,
        }
        
        // Se for dízimo, adicionar dados do dizimista
        if (isDizimo) {
          transactionData.tithePayerName = `Dizimista ${i}`
          transactionData.isTithePayerMember = false
        }
        
        const transaction = await createTransaction(app, auth.token, transactionData)
        entries.push(transaction)
        expect(transaction.id).toBeDefined()
      }

      // Criar 3 transações de saída
      console.log('[E2E] 💰 Criando múltiplas transações de saída...')
      const exits = []
      const exitTypes: Array<'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS'> = ['ALUGUEL', 'ENERGIA', 'AGUA']
      for (let i = 1; i <= 3; i++) {
        const transaction = await createTransaction(app, auth.token, {
          title: `Saída ${i} - E2E ${timestamp}`,
          amount: i * 50,
          type: 'EXIT',
          category: `Despesa ${i}`,
          exitType: exitTypes[i - 1],
        })
        exits.push(transaction)
        expect(transaction.id).toBeDefined()
      }

      // Verificar resumo
      const summaryResponse = await app.inject({
        method: 'GET',
        url: '/finances',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
      })

      expect(summaryResponse.statusCode).toBe(200)
      const summaryData = JSON.parse(summaryResponse.body)
      
      // Entradas: 100 + 200 + 300 + 400 + 500 = 1500
      const expectedEntries = 100 + 200 + 300 + 400 + 500
      // Saídas: 50 + 100 + 150 = 300
      const expectedExits = 50 + 100 + 150
      const expectedTotal = expectedEntries - expectedExits

      expect(summaryData.summary.entries).toBe(expectedEntries)
      expect(summaryData.summary.exits).toBe(expectedExits)
      expect(summaryData.summary.total).toBe(expectedTotal)
      expect(summaryData.transactions.length).toBeGreaterThanOrEqual(8)

      console.log('[E2E] ✅ Múltiplas transações criadas e resumo verificado!')
    })
  })
})

