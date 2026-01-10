/**
 * Template: Integration Test - Backend
 * 
 * Padrão Obrigatório: Mínimo de 7 testes por endpoint crítico
 * 
 * Estrutura:
 * - Given/When/Then (comentários)
 * - Banco de dados real (via .env.test)
 * - HTTP real (Supertest)
 * - Validar efeitos colaterais no banco
 * 
 * Localização: backend/tests/integration/[feature][Routes].test.ts
 * Exemplo: backend/tests/integration/onboardingProgress.test.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, createTestUserWithSubscription, generateTestToken, createTestChurchSetup } from '../utils/testFactories'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { prisma } from '../../src/lib/prisma'

describe('[Endpoint] - Integration Tests', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>
  let testUser: Awaited<ReturnType<typeof createTestUserWithSubscription>>
  let userToken: string
  let testChurch: Awaited<ReturnType<typeof createTestChurchSetup>>

  beforeAll(async () => {
    app = await createTestApp()
  })

  beforeEach(async () => {
    // ✅ OBRIGATÓRIO: Reset do banco em integration tests
    await resetTestDatabase()
    
    // Setup de dados de teste usando factories
    testUser = await createTestUserWithSubscription({
      user: {
        email: `test-${Date.now()}@example.com`, // Timestamp para evitar conflitos
        firstName: 'Test',
        lastName: 'User',
      },
    })

    // Gerar token JWT
    userToken = await generateTestToken(app, {
      sub: testUser.user.id,
      email: testUser.user.email,
      name: `${testUser.user.firstName} ${testUser.user.lastName}`.trim(),
      type: 'user',
      onboardingCompleted: false,
    })

    // Setup adicional se necessário (ex: igreja, membro, etc.)
    // testChurch = await createTestChurchSetup({ userId: testUser.user.id })
  })

  afterAll(async () => {
    await app.close()
    await resetTestDatabase()
  })

  // ============================================================================
  // TESTE 1: 200/201 SUCCESS - Caso de sucesso
  // ============================================================================
  it('deve [descrição do sucesso esperado] (200/201)', async () => {
    // Given - Estado inicial do sistema
    const payload = {
      // dados do payload
    }

    // When - Ação executada (requisição HTTP)
    const response = await request(app.server)
      .[method]('/[endpoint]')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload)

    // Then - Estado final e verificações
    expect(response.status).toBe(201) // ou 200, conforme esperado
    expect(response.body).toBeDefined()
    expect(response.body.[field]).toBe(expectedValue)

    // Verificação no banco de dados (efeitos colaterais)
    const entity = await prisma.[ModelName].findUnique({
      where: { id: response.body.[idField] },
    })
    expect(entity).not.toBeNull()
    expect(entity.[field]).toBe(expectedValue)
  })

  // ============================================================================
  // TESTE 2: 400 INVALID PAYLOAD - Payload inválido
  // ============================================================================
  it('deve retornar 400 se [campo] não fornecido', async () => {
    // Given - Payload inválido
    const invalidPayload = {
      // payload sem campo obrigatório
    }

    // When - Tentativa de criar com payload inválido
    const response = await request(app.server)
      .[method]('/[endpoint]')
      .set('Authorization', `Bearer ${userToken}`)
      .send(invalidPayload)

    // Then - Deve retornar erro 400
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
    expect(response.body.message).toContain('[campo]')
  })

  // ============================================================================
  // TESTE 3: 401 UNAUTHENTICATED - Não autenticado
  // ============================================================================
  it('deve retornar 401 se usuário não autenticado', async () => {
    // Given - Requisição sem token

    // When - Tentativa de acessar endpoint sem autenticação
    const response = await request(app.server)
      .[method]('/[endpoint]')
      // Sem header Authorization
      .send({ /* payload */ })

    // Then - Deve retornar erro 401
    expect(response.status).toBe(401)
    expect(response.body.error).toBeDefined()
    expect(response.body.message).toContain('autenticação')
  })

  // ============================================================================
  // TESTE 4: 403 FORBIDDEN - Quando aplicável
  // ============================================================================
  // ✅ Apenas se o endpoint verifica permissões/roles
  it('deve retornar 403 se usuário não tem permissão', async () => {
    // Given - Usuário sem permissão
    const unauthorizedUser = await createTestUserWithSubscription({
      user: { /* usuário sem permissão necessária */ },
    })
    const unauthorizedToken = await generateTestToken(app, {
      sub: unauthorizedUser.user.id,
      // sem role/permissão necessária
    })

    // When - Tentativa de acessar endpoint protegido
    const response = await request(app.server)
      .[method]('/[endpoint]')
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .send({ /* payload */ })

    // Then - Deve retornar erro 403
    expect(response.status).toBe(403)
    expect(response.body.error).toBeDefined()
    expect(response.body.message).toContain('permissão')
  })

  // ============================================================================
  // TESTE 5: 409 CONFLICT/IDEMPOTENCY - Quando aplicável
  // ============================================================================
  // ✅ Apenas se o endpoint precisa ser idempotente
  it('deve retornar entidade existente se [condição de idempotência] (200 OK)', async () => {
    // Given - Primeira criação bem-sucedida
    const payload = { /* payload */ }
    
    const response1 = await request(app.server)
      .[method]('/[endpoint]')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload)
    
    expect(response1.status).toBe(201)
    const entityId = response1.body.[idField]

    // When - Tentativa de criar novamente (duplicata)
    const response2 = await request(app.server)
      .[method]('/[endpoint]')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload)

    // Then - Deve retornar entidade existente (não criar duplicata)
    expect(response2.status).toBe(200)
    expect(response2.body.[idField]).toBe(entityId)

    // Verificar que não há duplicatas no banco
    const count = await prisma.[ModelName].count({
      where: { /* condições que identificam duplicata */ },
    })
    expect(count).toBe(1)
  })

  // ============================================================================
  // TESTE 6: 422 BUSINESS RULE - Regra de negócio
  // ============================================================================
  it('deve retornar 422 se [regra de negócio] violada', async () => {
    // Given - Estado que viola regra de negócio
    // Exemplos:
    // - Expired invite (end-of-day)
    // - MaxMembers do plano excedido
    // - MaxBranches do plano excedido
    // - InviteLink inativo
    // - MaxUses do invite excedido
    
    const payload = {
      // payload que viola regra
    }

    // When - Tentativa de criar/atualizar violando regra
    const response = await request(app.server)
      .[method]('/[endpoint]')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload)

    // Then - Deve retornar erro 422
    expect(response.status).toBe(422)
    expect(response.body.error).toBeDefined()
    expect(response.body.message).toContain('[descrição da regra]')
  })

  // ============================================================================
  // TESTE 7: DB SIDE-EFFECT ASSERTIONS - Efeitos colaterais no banco
  // ============================================================================
  it('deve criar/atualizar [entidades relacionadas] no banco ao [ação]', async () => {
    // Given - Estado inicial
    const initialCount = await prisma.[RelatedModel].count({
      where: { /* condições */ },
    })

    // When - Ação que deve criar efeitos colaterais
    const response = await request(app.server)
      .[method]('/[endpoint]')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ /* payload */ })

    expect(response.status).toBe(201)

    // Then - Verificar efeitos colaterais no banco
    const finalCount = await prisma.[RelatedModel].count({
      where: { /* condições */ },
    })
    expect(finalCount).toBe(initialCount + 1) // ou outra asserção

    // Verificar relacionamentos
    const entity = await prisma.[ModelName].findUnique({
      where: { id: response.body.[idField] },
      include: {
        [relatedField]: true,
      },
    })
    expect(entity.[relatedField]).toBeDefined()
    // Exemplos:
    // - Criar Church deve criar Branch e Member
    // - Completar onboarding deve atualizar OnboardingProgress
    // - Criar Member deve criar Permission
  })

  // ============================================================================
  // TESTES ADICIONAIS (opcionais, mas recomendados)
  // ============================================================================

  // Exemplo: Validação de formato
  // it('deve retornar 400 se formato de email inválido', async () => {
  //   // Given
  //   const invalidPayload = { email: 'invalid-email' }
  //
  //   // When
  //   const response = await request(app.server)
  //     .post('/[endpoint]')
  //     .set('Authorization', `Bearer ${userToken}`)
  //     .send(invalidPayload)
  //
  //   // Then
  //   expect(response.status).toBe(400)
  // })
})

/**
 * CHECKLIST ANTES DE COMMITAR:
 * 
 * ✅ Estrutura:
 * [ ] Arquivo está em backend/tests/integration/
 * [ ] Nome segue padrão: [feature][Routes].test.ts
 * [ ] Usa factories e resetTestDatabase corretamente
 * 
 * ✅ Conteúdo:
 * [ ] Mínimo 7 testes implementados
 * [ ] Padrão Given/When/Then em todos os testes
 * [ ] Usa banco de dados real (com resetTestDatabase)
 * [ ] Testes são determinísticos
 * 
 * ✅ Nomenclatura:
 * [ ] Nomes seguem padrão: "deve [comportamento esperado]"
 * 
 * ✅ Validações:
 * [ ] Valida status HTTP correto
 * [ ] Valida estrutura da resposta
 * [ ] Valida efeitos colaterais no banco (teste 7)
 * 
 * ✅ Isolamento:
 * [ ] beforeEach reseta banco e cria dados frescos
 * [ ] afterAll limpa recursos
 * [ ] Testes podem ser executados independentemente
 */

