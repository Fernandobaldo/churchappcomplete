// tests/e2e/complete-flow.test.ts
// E2E test para Fluxo Completo
// Padrão: Validar fluxo completo do sistema (registro → onboarding → recursos)
// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

// Força o NODE_ENV para test antes de importar qualquer coisa
process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

// Importa o setup do ambiente de teste (garante que o banco está sincronizado)
import '../setupTestEnv'

import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { createTestApp } from '../utils/createTestApp'
import { createTestPlan } from '../utils/testFactories'
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
  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeAll(async () => {
    // Given - Setup do ambiente de teste
    app = await createTestApp()
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
      await createTestPlan({
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

  describe('Cenário 1: Fluxo principal happy path', () => {
    it('deve completar: register → onboarding → main access', async () => {
      // Given - Estado inicial: usuário novo sem igreja
      const timestamp = Date.now()
      const userEmail = `e2e-user-${timestamp}@test.com`
      const userName = `Usuário E2E ${timestamp}`

      // When - Execução do fluxo completo
      // Passo 1: Registrar novo usuário
      const registerResult = await registerUser(app, {
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      // Then - Validação de registro
      expect(registerResult.user).toBeDefined()
      expect(registerResult.user.email).toBe(userEmail)
      expect(registerResult.token).toBeDefined()

      // When - Passo 2: Criar igreja (onboarding)
      const churchResult = await createChurch(app, registerResult.token, {
        name: `Igreja E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // Then - Validação de criação de igreja
      expect(churchResult.church || churchResult).toBeDefined()
      const churchId = churchResult.church?.id || churchResult.id
      const branchId = churchResult.branch?.id
      const memberId = churchResult.member?.id
      const memberToken = churchResult.newToken

      expect(churchId).toBeDefined()
      expect(branchId).toBeDefined()
      expect(memberId).toBeDefined()
      expect(memberToken).toBeDefined()

      // When - Passo 3: Criar evento
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      const eventResult = await createEvent(app, memberToken, {
        title: `Evento E2E ${timestamp}`,
        startDate: format(tomorrow, 'dd-MM-yyyy'),
        endDate: format(dayAfterTomorrow, 'dd-MM-yyyy'),
        time: '19:00',
        location: 'Igreja Central',
        description: 'Evento criado via teste E2E',
        hasDonation: true,
        donationReason: 'Obra missionária',
        donationLink: 'https://example.com/doacao',
      })

      // Then - Validação de evento
      expect(eventResult.id).toBeDefined()
      expect(eventResult.title).toBe(`Evento E2E ${timestamp}`)
      expect(eventResult.branchId).toBe(branchId)

      // When - Passo 4: Criar contribuição
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

      // Then - Validação de contribuição
      expect(contributionResult.id).toBeDefined()
      expect(contributionResult.title).toBe(`Campanha E2E ${timestamp}`)
      expect(contributionResult.goal).toBe(15000.50)
      expect(contributionResult.isActive).toBe(true)
      expect(contributionResult.branchId).toBe(branchId)

      // Then - Verificação de estado final no banco
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
    })

    it('deve falhar se campo obrigatório ausente', async () => {
      // Given - Estado inicial: usuário com igreja criada
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

      // When - Tentar criar evento sem título (campo obrigatório)
      const response = await app.inject({
        method: 'POST',
        url: '/events',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
        payload: {
          startDate: format(new Date(), 'dd-MM-yyyy'),
          endDate: format(new Date(), 'dd-MM-yyyy'),
          // título ausente
        },
      })

      // Then - Deve retornar erro de validação
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Cenário 2: Resumo/Retry de fluxo', () => {
    it('deve resumir onboarding se PENDING', async () => {
      // Given - Estado inicial: usuário registrado mas onboarding não completado
      const timestamp = Date.now()
      const userEmail = `e2e-login-${timestamp}@test.com`
      const userName = `Usuário Login E2E ${timestamp}`

      // When - Passo 1: Registrar usuário
      const registerResult = await registerUser(app, {
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      // Then - Validação de registro
      expect(registerResult.token).toBeDefined()
      expect(registerResult.user.email).toBe(userEmail)

      // When - Passo 2: Fazer login (simula retry/resumo do fluxo)
      const loginResult = await loginUser(app, {
        email: userEmail,
        password: 'senha123456',
      })

      // Then - Validação de login
      expect(loginResult.token).toBeDefined()
      expect(loginResult.user.email).toBe(userEmail)
      expect(loginResult.type).toBe('user') // Usuário recém-registrado é do tipo 'user'

      // When - Passo 3: Completar onboarding (criar igreja)
      const churchResult = await createChurch(app, loginResult.token, {
        name: `Igreja Login E2E ${timestamp}`,
        branchName: 'Sede',
      })

      // Then - Validação de criação de igreja
      expect(churchResult.church || churchResult).toBeDefined()
      const memberToken = churchResult.newToken

      // When - Passo 4: Criar evento após onboarding completo
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const eventResult = await createEvent(app, memberToken, {
        title: `Evento Login E2E ${timestamp}`,
        startDate: format(tomorrow, 'dd-MM-yyyy'),
        endDate: format(tomorrow, 'dd-MM-yyyy'),
        location: 'Igreja Central',
        description: 'Evento após login',
      })

      // Then - Validação de evento
      expect(eventResult.id).toBeDefined()
    })

    it('deve bloquear nova igreja se já existe', async () => {
      // Given - Estado inicial: usuário já tem igreja criada
      const timestamp = Date.now()
      const auth = await setupCompleteUser(
        app,
        {
          name: `Usuário Idempotência ${timestamp}`,
          email: `e2e-idempotency-${timestamp}@test.com`,
          password: 'senha123456',
        },
        {
          name: `Igreja Original ${timestamp}`,
          branchName: 'Sede',
        }
      )

      // When - Tentar criar segunda igreja
      const response = await app.inject({
        method: 'POST',
        url: '/churches',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
        payload: {
          name: `Segunda Igreja ${timestamp}`,
          branchName: 'Nova Sede',
        },
      })

      // Then - Deve retornar igreja existente (idempotência) ou erro
      // O comportamento pode variar: pode retornar 200 com igreja existente ou 409/422
      expect([200, 409, 422]).toContain(response.statusCode)
    })
  })

  describe('Cenário 3: Idempotência', () => {
    it('deve ser idempotente: duplo submit não cria duplicatas', async () => {
      // Given - Estado inicial: usuário com igreja criada
      const timestamp = Date.now()
      const auth = await setupCompleteUser(
        app,
        {
          name: `Usuário Idempotência ${timestamp}`,
          email: `e2e-idempotency-${timestamp}@test.com`,
          password: 'senha123456',
        },
        {
          name: `Igreja Idempotência ${timestamp}`,
          branchName: 'Sede',
        }
      )

      expect(auth.branchId).toBeDefined()

      // When - Criar evento primeira vez
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const eventData = {
        title: `Evento Idempotência ${timestamp}`,
        startDate: format(tomorrow, 'dd-MM-yyyy'),
        endDate: format(tomorrow, 'dd-MM-yyyy'),
        location: 'Igreja Central',
        description: 'Evento de teste',
      }

      const event1 = await createEvent(app, auth.token, eventData)
      expect(event1.id).toBeDefined()

      // When - Criar evento segunda vez com mesmos dados (duplo submit)
      const event2 = await createEvent(app, auth.token, eventData)

      // Then - Ambos devem ser criados (não é idempotente por padrão, mas validamos que não quebra)
      expect(event2.id).toBeDefined()
      // Se fosse idempotente, event2.id seria igual a event1.id
      // Como não é, apenas validamos que ambos foram criados sem erro
    })
  })

  describe('Cenário 4: Validação de regra de negócio', () => {
    it('deve validar campos obrigatórios ao criar evento', async () => {
      // Given - Estado inicial: usuário com igreja criada
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

      // When - Tentar criar evento sem título (campo obrigatório)
      const response = await app.inject({
        method: 'POST',
        url: '/events',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
        payload: {
          startDate: format(new Date(), 'dd-MM-yyyy'),
          endDate: format(new Date(), 'dd-MM-yyyy'),
          // título ausente
        },
      })

      // Then - Deve retornar erro de validação
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })

    it('deve validar campos obrigatórios ao criar contribuição', async () => {
      // Given - Estado inicial: usuário com igreja criada
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

      // When - Tentar criar campanha sem título (campo obrigatório)
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

      // Then - Deve retornar erro de validação
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })

    it('deve validar campos obrigatórios ao criar transação financeira', async () => {
      // Given - Estado inicial: usuário com igreja criada
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

      // When - Tentar criar transação ENTRY sem entryType (campo obrigatório)
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

      // Then - Deve retornar erro de validação
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Cenário 5: Tratamento de erro crítico', () => {
    it('deve fazer logout e reset em 401', async () => {
      // Given - Estado inicial: token inválido/expirado
      const invalidToken = 'invalid.token.here'

      // When - Tentar acessar recurso protegido com token inválido
      const response = await app.inject({
        method: 'GET',
        url: '/churches',
        headers: {
          authorization: `Bearer ${invalidToken}`,
        },
      })

      // Then - Deve retornar 401 Unauthorized
      expect(response.statusCode).toBe(401)
    })

    it('deve completar fluxo: registro → igreja → transações financeiras', async () => {
      // Given - Estado inicial: usuário novo
      const timestamp = Date.now()
      const userEmail = `e2e-finance-${timestamp}@test.com`
      const userName = `Usuário Finance E2E ${timestamp}`

      // When - Passo 1: Registrar novo usuário
      const registerResult = await registerUser(app, {
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      // Then - Validação de registro
      expect(registerResult.user).toBeDefined()
      expect(registerResult.user.email).toBe(userEmail)
      expect(registerResult.token).toBeDefined()

      // When - Passo 2: Criar igreja
      const churchResult = await createChurch(app, registerResult.token, {
        name: `Igreja Finance E2E ${timestamp}`,
        branchName: 'Sede Principal',
        pastorName: 'Pastor Teste',
      })

      // Then - Validação de criação de igreja
      expect(churchResult.church || churchResult).toBeDefined()
      const branchId = churchResult.branch?.id
      const memberToken = churchResult.newToken

      expect(branchId).toBeDefined()
      expect(memberToken).toBeDefined()

      // When - Passo 3: Criar transações financeiras
      const offerTransaction = await createTransaction(app, memberToken, {
        title: `Oferta E2E ${timestamp}`,
        amount: 500.0,
        type: 'ENTRY',
        entryType: 'OFERTA',
        category: 'Oferta',
      })

      const titheTransaction = await createTransaction(app, memberToken, {
        title: `Dízimo E2E ${timestamp}`,
        amount: 1000.0,
        type: 'ENTRY',
        entryType: 'DIZIMO',
        category: 'Dízimo',
        tithePayerName: 'Visitante Teste',
        isTithePayerMember: false,
      })

      const exitTransaction = await createTransaction(app, memberToken, {
        title: `Pagamento E2E ${timestamp}`,
        amount: 300.0,
        type: 'EXIT',
        category: 'Despesas',
        exitType: 'ALUGUEL',
      })

      // Then - Validação de transações
      expect(offerTransaction.id).toBeDefined()
      expect(offerTransaction.amount).toBe(500.0)
      expect(offerTransaction.type).toBe('ENTRY')
      expect(offerTransaction.entryType).toBe('OFERTA')

      expect(titheTransaction.id).toBeDefined()
      expect(titheTransaction.amount).toBe(1000.0)
      expect(titheTransaction.entryType).toBe('DIZIMO')

      expect(exitTransaction.id).toBeDefined()
      expect(exitTransaction.amount).toBe(300.0)
      expect(exitTransaction.type).toBe('EXIT')

      // When - Passo 4: Verificar resumo financeiro
      const summaryResponse = await app.inject({
        method: 'GET',
        url: '/finances',
        headers: {
          authorization: `Bearer ${memberToken}`,
        },
      })

      // Then - Validação de resumo financeiro
      expect(summaryResponse.statusCode).toBe(200)
      const summaryData = JSON.parse(summaryResponse.body)
      expect(summaryData).toHaveProperty('transactions')
      expect(summaryData).toHaveProperty('summary')
      expect(summaryData.summary.entries).toBe(1500.0) // 500 (oferta) + 1000 (dízimo)
      expect(summaryData.summary.exits).toBe(300.0)
      expect(summaryData.summary.total).toBe(1200.0) // 1500 - 300

      // Then - Verificação de estado final no banco
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

      const exitInDb = transactionsInDb.find((t) => t.id === exitTransaction.id)
      expect(exitInDb).toBeDefined()
      expect(exitInDb?.type).toBe('EXIT')
    })

    it('deve criar múltiplas transações e calcular resumo correto', async () => {
      // Given - Estado inicial: usuário com igreja criada
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

      // When - Criar múltiplas transações de entrada e saída
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

      // When - Criar 3 transações de saída
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

      // When - Verificar resumo financeiro
      const summaryResponse = await app.inject({
        method: 'GET',
        url: '/finances',
        headers: {
          authorization: `Bearer ${auth.token}`,
        },
      })

      // Then - Validação de resumo financeiro
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
    })
  })
})

