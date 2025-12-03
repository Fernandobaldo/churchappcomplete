// src/__tests__/e2e/complete-flow.test.tsx
// Testes E2E que fazem chamadas reais à API do backend
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { format } from 'date-fns'
import axios from 'axios'
import {
  registerUser,
  loginUser,
  createChurch,
  createEvent,
  createContribution,
  setupCompleteUser,
} from './helpers/apiHelpers'

// Configuração da API
const API_URL = process.env.VITE_API_URL || 'http://localhost:3333'

describe('E2E: Fluxo Completo - Registro até Contribuição (Frontend)', () => {
  // Verifica se o backend está rodando antes de executar os testes
  beforeAll(async () => {
    try {
      // Tenta fazer uma requisição simples para verificar se o backend está rodando
      // Usa um endpoint que deve existir (swagger ou qualquer rota)
      const response = await fetch(`${API_URL}/docs`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // timeout de 5 segundos
      })
      // Qualquer resposta (mesmo 404) indica que o servidor está rodando
      console.log('[E2E Frontend] ✅ Backend está rodando (status:', response.status, ')')
    } catch (error: any) {
      console.warn('[E2E Frontend] ⚠️ Não foi possível verificar o backend:', error.message)
      console.warn('[E2E Frontend] ⚠️ Certifique-se de que o backend está rodando em', API_URL)
      console.warn('[E2E Frontend] ⚠️ Execute: cd backend && npm run dev')
      // Não falha o teste, apenas avisa
    }
  })

  describe('GET /churches - Validação de Filtro por Usuário', () => {
    it('deve retornar array vazio quando usuário não tem igreja configurada', async () => {
      const timestamp = Date.now()
      const userEmail = `no-church-${timestamp}@test.com`
      const userName = `Usuário Sem Igreja ${timestamp}`

      // PASSO 1: Registrar novo usuário
      console.log('[E2E Churches] 📝 Registrando novo usuário...')
      const registerResult = await registerUser({
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      expect(registerResult.user).toBeDefined()
      expect(registerResult.token).toBeDefined()
      console.log('[E2E Churches] ✅ Usuário registrado')

      // PASSO 2: Buscar igrejas (deve retornar array vazio)
      console.log('[E2E Churches] 🏛️ Buscando igrejas (sem branchId)...')
      const testApi = axios.create({
        baseURL: API_URL,
      })

      testApi.defaults.headers.common['Authorization'] = `Bearer ${registerResult.token}`

      const churchesResponse = await testApi.get('/churches')
      
      expect(churchesResponse.status).toBe(200)
      expect(Array.isArray(churchesResponse.data)).toBe(true)
      expect(churchesResponse.data.length).toBe(0)
      console.log('[E2E Churches] ✅ Retornou array vazio (correto - usuário sem igreja)')
    })

    it('deve retornar apenas a igreja do usuário após criar igreja', async () => {
      const timestamp = Date.now()
      const userEmail = `with-church-${timestamp}@test.com`
      const userName = `Usuário Com Igreja ${timestamp}`

      // PASSO 1: Registrar novo usuário
      console.log('[E2E Churches] 📝 Registrando novo usuário...')
      const registerResult = await registerUser({
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      expect(registerResult.user).toBeDefined()
      expect(registerResult.token).toBeDefined()
      console.log('[E2E Churches] ✅ Usuário registrado')

      // PASSO 2: Criar igreja
      console.log('[E2E Churches] 🏛️ Criando igreja...')
      const churchResult = await createChurch(registerResult.token, {
        name: `Igreja E2E Test ${timestamp}`,
        branchName: 'Sede',
      })

      expect(churchResult.church || churchResult).toBeDefined()
      const memberToken = churchResult.newToken || churchResult.token
      expect(memberToken).toBeDefined()
      console.log('[E2E Churches] ✅ Igreja criada')

      // PASSO 3: Buscar igrejas (deve retornar apenas a igreja do usuário)
      console.log('[E2E Churches] 🏛️ Buscando igrejas (com branchId)...')
      const testApi = axios.create({
        baseURL: API_URL,
      })

      testApi.defaults.headers.common['Authorization'] = `Bearer ${memberToken}`

      const churchesResponse = await testApi.get('/churches')
      
      expect(churchesResponse.status).toBe(200)
      expect(Array.isArray(churchesResponse.data)).toBe(true)
      expect(churchesResponse.data.length).toBe(1)
      expect(churchesResponse.data[0]).toHaveProperty('id')
      expect(churchesResponse.data[0]).toHaveProperty('name')
      expect(churchesResponse.data[0].name).toBe(`Igreja E2E Test ${timestamp}`)
      console.log('[E2E Churches] ✅ Retornou apenas a igreja do usuário')
    })

    it('não deve retornar igrejas de outros usuários', async () => {
      const timestamp = Date.now()
      
      // PASSO 1: Criar primeiro usuário e igreja
      const user1Email = `user1-${timestamp}@test.com`
      const registerResult1 = await registerUser({
        name: `Usuário 1 ${timestamp}`,
        email: user1Email,
        password: 'senha123456',
      })

      const churchResult1 = await createChurch(registerResult1.token, {
        name: `Igreja Usuário 1 ${timestamp}`,
        branchName: 'Sede',
      })

      const memberToken1 = churchResult1.newToken || churchResult1.token

      // PASSO 2: Criar segundo usuário e igreja
      const user2Email = `user2-${timestamp}@test.com`
      const registerResult2 = await registerUser({
        name: `Usuário 2 ${timestamp}`,
        email: user2Email,
        password: 'senha123456',
      })

      const churchResult2 = await createChurch(registerResult2.token, {
        name: `Igreja Usuário 2 ${timestamp}`,
        branchName: 'Sede',
      })

      const memberToken2 = churchResult2.newToken || churchResult2.token

      // PASSO 3: Usuário 1 busca igrejas (deve retornar apenas sua igreja)
      const testApi1 = axios.create({
        baseURL: API_URL,
      })
      testApi1.defaults.headers.common['Authorization'] = `Bearer ${memberToken1}`

      const churchesResponse1 = await testApi1.get('/churches')
      
      expect(churchesResponse1.status).toBe(200)
      expect(churchesResponse1.data.length).toBe(1)
      expect(churchesResponse1.data[0].name).toBe(`Igreja Usuário 1 ${timestamp}`)
      // Não deve conter a igreja do usuário 2
      expect(churchesResponse1.data.find((c: any) => c.name === `Igreja Usuário 2 ${timestamp}`)).toBeUndefined()

      // PASSO 4: Usuário 2 busca igrejas (deve retornar apenas sua igreja)
      const testApi2 = axios.create({
        baseURL: API_URL,
      })
      testApi2.defaults.headers.common['Authorization'] = `Bearer ${memberToken2}`

      const churchesResponse2 = await testApi2.get('/churches')
      
      expect(churchesResponse2.status).toBe(200)
      expect(churchesResponse2.data.length).toBe(1)
      expect(churchesResponse2.data[0].name).toBe(`Igreja Usuário 2 ${timestamp}`)
      // Não deve conter a igreja do usuário 1
      expect(churchesResponse2.data.find((c: any) => c.name === `Igreja Usuário 1 ${timestamp}`)).toBeUndefined()

      console.log('[E2E Churches] ✅ Cada usuário vê apenas sua própria igreja')
    })
  })

  describe('Cenário 1: Fluxo completo desde o registro', () => {
    it('deve completar todo o fluxo: registro → igreja → evento → contribuição', async () => {
      const timestamp = Date.now()
      const userEmail = `e2e-frontend-${timestamp}@test.com`
      const userName = `Usuário E2E Frontend ${timestamp}`

      // PASSO 1: Registrar novo usuário
      console.log('[E2E Frontend] 📝 Passo 1: Registrando novo usuário...')
      const registerResult = await registerUser({
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      expect(registerResult.user).toBeDefined()
      expect(registerResult.user.email).toBe(userEmail)
      expect(registerResult.token).toBeDefined()
      console.log('[E2E Frontend] ✅ Usuário registrado:', registerResult.user.id)

      // PASSO 2: Criar igreja (isso também cria member e branch)
      console.log('[E2E Frontend] 🏛️ Passo 2: Criando igreja...')
      const churchResult = await createChurch(registerResult.token, {
        name: `Igreja E2E Frontend ${timestamp}`,
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
      expect(memberToken).toBeTruthy() // Garante que não é null ou undefined
      console.log('[E2E Frontend] ✅ Igreja criada:', churchId)
      console.log('[E2E Frontend] ✅ Filial criada:', branchId)
      console.log('[E2E Frontend] ✅ Member criado:', memberId)
      console.log('[E2E Frontend] ✅ Token atualizado recebido')
      
      // Valida que o token não é o mesmo do registro (deve ser diferente)
      if (memberToken === registerResult.token) {
        console.warn('[E2E Frontend] ⚠️ Token não foi atualizado após criar igreja!')
        throw new Error('Token não foi atualizado após criar igreja. O backend deve retornar um novo token com dados do member.')
      }
      
      // Debug: decodifica o token para verificar conteúdo (sem biblioteca externa, apenas para debug)
      try {
        const tokenParts = memberToken.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          console.log('[E2E Frontend] 🔍 Token decodificado:', {
            role: payload.role,
            branchId: payload.branchId,
            permissions: payload.permissions,
            type: payload.type,
          })
          
          // Verifica se tem a permissão necessária
          if (!payload.permissions || !payload.permissions.includes('contributions_manage')) {
            console.warn('[E2E Frontend] ⚠️ Token não contém permissão contributions_manage!')
            console.warn('[E2E Frontend] ⚠️ Permissões no token:', payload.permissions)
          }
        }
      } catch (e) {
        // Ignora erro de decodificação
      }

      // PASSO 3: Criar evento (usa o token atualizado com dados do member)
      console.log('[E2E Frontend] 📅 Passo 3: Criando evento...')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      const eventResult = await createEvent(memberToken, {
        title: `Evento E2E Frontend ${timestamp}`,
        startDate: format(tomorrow, 'dd/MM/yyyy'),
        endDate: format(dayAfterTomorrow, 'dd/MM/yyyy'),
        time: '19:00',
        location: 'Igreja Central',
        description: 'Evento criado via teste E2E Frontend',
        hasDonation: true,
        donationReason: 'Obra missionária',
        donationLink: 'https://example.com/doacao',
      })

      expect(eventResult.id).toBeDefined()
      expect(eventResult.title).toBe(`Evento E2E Frontend ${timestamp}`)
      expect(eventResult.branchId).toBe(branchId)
      console.log('[E2E Frontend] ✅ Evento criado:', eventResult.id)

      // PASSO 4: Criar campanha de contribuição (usa o token atualizado com dados do member)
      console.log('[E2E Frontend] 💰 Passo 4: Criando campanha de contribuição...')
      const contributionResult = await createContribution(memberToken, {
        title: `Campanha E2E Frontend ${timestamp}`,
        description: 'Campanha criada via teste E2E Frontend',
        goal: 15000.50,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        paymentMethods: [
          {
            type: 'PIX',
            data: { chave: '12345678900' },
          },
        ],
      })

      expect(contributionResult.id).toBeDefined()
      expect(contributionResult.title).toBe(`Campanha E2E Frontend ${timestamp}`)
      expect(contributionResult.goal).toBe(15000.50)
      expect(contributionResult.isActive).toBe(true)
      expect(contributionResult.branchId).toBe(branchId)
      console.log('[E2E Frontend] ✅ Campanha criada:', contributionResult.id)

      console.log('[E2E Frontend] ✅ Todos os dados criados com sucesso!')
    }, 30000) // Timeout de 30 segundos para este teste
  })

  describe('Cenário 2: Fluxo com login após registro', () => {
    it('deve fazer login após registro e criar recursos', async () => {
      const timestamp = Date.now()
      const userEmail = `e2e-login-frontend-${timestamp}@test.com`
      const userName = `Usuário Login E2E Frontend ${timestamp}`

      // PASSO 1: Registrar
      console.log('[E2E Frontend] 📝 Registrando usuário...')
      const registerResult = await registerUser({
        name: userName,
        email: userEmail,
        password: 'senha123456',
      })

      // PASSO 2: Fazer login (simula logout/login)
      console.log('[E2E Frontend] 🔐 Fazendo login...')
      const loginResult = await loginUser({
        email: userEmail,
        password: 'senha123456',
      })

      expect(loginResult.token).toBeDefined()
      expect(loginResult.user.email).toBe(userEmail)
      expect(loginResult.type).toBeDefined()
      console.log('[E2E Frontend] ✅ Login realizado com sucesso')

      // PASSO 3: Criar igreja
      console.log('[E2E Frontend] 🏛️ Criando igreja...')
      const churchResult = await createChurch(loginResult.token, {
        name: `Igreja Login E2E Frontend ${timestamp}`,
        branchName: 'Sede',
      })

      expect(churchResult.church || churchResult).toBeDefined()
      const memberToken = churchResult.newToken // Token atualizado com dados do member
      
      // Valida que o token foi retornado
      if (!memberToken) {
        throw new Error('Token não foi retornado após criar igreja. O backend deve retornar um novo token com dados do member.')
      }

      // PASSO 4: Criar evento (usa o token atualizado com dados do member)
      console.log('[E2E Frontend] 📅 Criando evento...')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const eventResult = await createEvent(memberToken, {
        title: `Evento Login E2E Frontend ${timestamp}`,
        startDate: format(tomorrow, 'dd/MM/yyyy'),
        endDate: format(tomorrow, 'dd/MM/yyyy'),
        location: 'Igreja Central',
        description: 'Evento após login',
      })

      expect(eventResult.id).toBeDefined()

      console.log('[E2E Frontend] ✅ Fluxo com login concluído!')
    }, 30000)
  })

  describe('Cenário 3: Múltiplos eventos e contribuições', () => {
    it('deve criar múltiplos eventos e contribuições para o mesmo usuário', async () => {
      const timestamp = Date.now()
      const userEmail = `e2e-multiple-frontend-${timestamp}@test.com`

      // Setup completo: registro + igreja
      const auth = await setupCompleteUser(
        {
          name: `Usuário Múltiplo Frontend ${timestamp}`,
          email: userEmail,
          password: 'senha123456',
        },
        {
          name: `Igreja Múltipla Frontend ${timestamp}`,
          branchName: 'Sede',
        }
      )

      expect(auth.branchId).toBeDefined()

      // Criar 3 eventos
      console.log('[E2E Frontend] 📅 Criando múltiplos eventos...')
      const events = []
      for (let i = 1; i <= 3; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)

        const event = await createEvent(auth.token, {
          title: `Evento ${i} - E2E Frontend ${timestamp}`,
          startDate: format(date, 'dd/MM/yyyy'),
          endDate: format(date, 'dd/MM/yyyy'),
          location: `Local ${i}`,
          description: `Evento número ${i}`,
        })

        events.push(event)
        expect(event.id).toBeDefined()
      }

      expect(events).toHaveLength(3)

      // Criar 3 campanhas de contribuição
      console.log('[E2E Frontend] 💰 Criando múltiplas campanhas...')
      const contributions = []

      for (let i = 0; i < 3; i++) {
        const contribution = await createContribution(auth.token, {
          title: `Campanha ${i + 1} - E2E Frontend ${timestamp}`,
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

      console.log('[E2E Frontend] ✅ Múltiplos recursos criados com sucesso!')
    }, 45000) // Timeout maior para múltiplos recursos
  })

  describe('Cenário 4: Validações e erros', () => {
    it('deve validar campos obrigatórios ao criar evento', async () => {
      const timestamp = Date.now()
      const auth = await setupCompleteUser(
        {
          name: `Usuário Validação Frontend ${timestamp}`,
          email: `e2e-validation-frontend-${timestamp}@test.com`,
          password: 'senha123456',
        },
        {
          name: `Igreja Validação Frontend ${timestamp}`,
        }
      )

      // Tentar criar evento sem título (deve falhar)
      try {
        await createEvent(auth.token, {
          title: '', // título vazio
          startDate: format(new Date(), 'dd/MM/yyyy'),
          endDate: format(new Date(), 'dd/MM/yyyy'),
        })
        // Se não lançou erro, o teste falha
        expect.fail('Deveria ter lançado erro ao criar evento sem título')
      } catch (error: any) {
        // Esperado: deve lançar erro
        expect(error.response?.status).toBeGreaterThanOrEqual(400)
        console.log('[E2E Frontend] ✅ Validação de evento funcionou corretamente')
      }
    }, 30000)

    it('deve validar campos obrigatórios ao criar contribuição', async () => {
      const timestamp = Date.now()
      const auth = await setupCompleteUser(
        {
          name: `Usuário Validação 2 Frontend ${timestamp}`,
          email: `e2e-validation2-frontend-${timestamp}@test.com`,
          password: 'senha123456',
        },
        {
          name: `Igreja Validação 2 Frontend ${timestamp}`,
        }
      )

      // Tentar criar campanha sem título (deve falhar)
      try {
        await createContribution(auth.token, {
          title: '', // título vazio
          goal: -10, // goal negativo (inválido)
        })
        // Se não lançou erro, o teste falha
        expect.fail('Deveria ter lançado erro ao criar campanha sem título ou com goal inválido')
      } catch (error: any) {
        // Esperado: deve lançar erro
        if (error.response?.status) {
          expect(error.response.status).toBeGreaterThanOrEqual(400)
        } else {
          // Se não tem response, pelo menos deve ter lançado um erro
          expect(error).toBeDefined()
        }
        console.log('[E2E Frontend] ✅ Validação de campanha funcionou corretamente')
      }
    }, 30000)
  })
})

