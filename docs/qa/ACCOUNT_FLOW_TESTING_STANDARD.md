# Padrão de Testes: Fluxo de Criação de Conta e Primeiro Acesso

**Data:** 2025-02-01  
**Versão:** 1.0  
**Status:** Implementado

---

## 📋 Sumário Executivo

Este documento descreve o padrão rigoroso e reutilizável de testes para o fluxo de criação de conta e primeiro acesso (Account Flow), incluindo:

- **Backend:** Unit + Integration + E2E
- **UI Mobile/Web:** Unit + Integration + E2E
- **Padrões obrigatórios:** Quantidade mínima de testes por módulo/endpoint/fluxo
- **Infraestrutura reutilizável:** Helpers, factories e builders para todos os testes

---

## 🎯 Padrões Obrigatórios de Testes

### A) Unit Tests – Backend (services/utils/guards)

**Padrão:** Mínimo de **6 testes** por módulo crítico:

1. **Success** - Caso de sucesso básico
2. **Validation failure** - Falha de validação
3. **Forbidden/Unauthorized** - Quando aplicável
4. **Edge case #1** - Datas/limites/null
5. **Edge case #2** - Estado inconsistente
6. **Dependency failure propagation** - Propagação de erros de dependências

**Módulos críticos testados:**
- `OnboardingProgressService` - ✅ 6+ testes
- `ChurchService` - ⚠️ Parcial (precisa atualizar para padrão)
- `AuthService` - ⚠️ Parcial (precisa atualizar para padrão)

### B) Unit Tests – UI (mobile/web components/screens)

**Padrão:** Mínimo de **5 testes** por componente/screen crítico:

1. **Basic render** - Renderização básica
2. **Loading state** - Estado de carregamento
3. **Error state + retry** - Estado de erro e retry
4. **Empty state** - Estado vazio (manter tabs/header visíveis quando aplicável)
5. **Primary interaction** - Interação principal (submit/click chama handler/action correto)

**Componentes/Screens críticos testados:**
- `AuthStore` (onboardingCompleted) - ✅ 5+ testes
- `AppNavigator` (guard) - ✅ 6 testes (integration)
- `ChurchScreen` - ⚠️ Pendente

### C) Integration Tests – Backend (HTTP + DB)

**Padrão:** Mínimo de **7 testes** por endpoint crítico:

1. **200/201 Success** - Sucesso
2. **400 Invalid payload** - Payload inválido
3. **401 Unauthenticated** - Não autenticado
4. **403 Forbidden** - Quando aplicável
5. **409 Conflict/Idempotency** - Quando aplicável
6. **422 Business rule** - Regra de negócio (expired invite, maxMembers, etc.)
7. **DB side-effect assertions** - Assertivas de efeitos colaterais no banco

**Endpoints críticos testados:**
- `GET /onboarding/progress` - ✅ 7 testes
- `POST /onboarding/progress/:step` - ✅ 7 testes
- `POST /onboarding/complete` - ✅ 7 testes
- `POST /churches` (prevenção duplicação) - ✅ 7 testes
- `POST /auth/login` (onboardingCompleted) - ⚠️ Parcial

### D) Integration Tests – UI (navigator + store + mocked API)

**Padrão:** Mínimo de **6 testes** por fluxo crítico:

1. **Route guard baseado em NEW/PENDING/COMPLETE** - Guard de navegação
2. **Onboarding prefill quando PENDING** - Preenchimento automático
3. **Submit updates token/store** - Atualização de token/store
4. **Backend error shows feedback** - Feedback de erro
5. **Retry/refresh works** - Retry/refresh funciona
6. **Invalid action is blocked** - Ações inválidas bloqueadas (ex: duplicar igreja)

**Fluxos críticos testados:**
- `AppNavigator` (guard com onboardingCompleted) - ✅ 6 testes
- `Onboarding Flow` (mobile) - ⚠️ Parcial
- `Onboarding Flow` (web) - ⚠️ Parcial

### E) E2E Scenarios (não sobrepostos)

**Padrão:** Mínimo de **5 cenários** não sobrepostos:

1. **Register → complete onboarding → Main access** (inclui negativo: campo obrigatório)
2. **Abandon onboarding → resume PENDING** com prefill correto (negativo: bloqueia nova igreja)
3. **Idempotency:** Duplo submit / reabrir onboarding não cria duplicatas (negativo incluído)
4. **Invite join:** Válido + inválido (expired end-of-day, inactive, maxUses)
5. **401 handling:** Token inválido → logout + reset para login; não pode voltar para telas protegidas

**Cenários E2E:**
- ⚠️ Implementação parcial - precisa completar

---

## 🛠️ Infraestrutura de Testes Reutilizável

### Backend: Factories e Builders

**Localização:** `backend/tests/utils/testFactories.ts`

**Funcionalidades:**
- `createTestUser()` - Cria User de teste
- `createTestPlan()` - Cria Plan de teste
- `createTestSubscription()` - Cria Subscription de teste
- `createTestChurch()` - Cria Church de teste
- `createTestBranch()` - Cria Branch de teste
- `createTestMember()` - Cria Member de teste
- `createTestOnboardingProgress()` - Cria OnboardingProgress de teste
- `createTestInviteLink()` - Cria InviteLink de teste
- `createTestUserWithSubscription()` - Helper para setup completo
- `createTestChurchSetup()` - Helper para setup completo (User + Church + Branch + Member)
- `createTestApp()` - Cria app Fastify para testes
- `generateTestToken()` - Gera token JWT para testes

**Exemplo de uso:**
```typescript
import { createTestUserWithSubscription, createTestApp, generateTestToken } from '../utils/testFactories'

const testUser = await createTestUserWithSubscription({
  user: { email: 'test@example.com' },
})
const app = await createTestApp()
const token = await generateTestToken(app, {
  sub: testUser.user.id,
  email: testUser.user.email,
  name: 'Test User',
  onboardingCompleted: false,
})
```

### Backend: Helpers de Teste

**Localização:** `backend/tests/utils/`

**Helpers disponíveis:**
- `resetTestDatabase()` - Reseta banco de dados de teste
- `seedTestDatabase()` - Cria dados de seed para testes
- `testResponseHelper.ts` - Helpers para log de responses
- `testErrorHelper.ts` - Helpers para tratamento de erros

### Mobile: Helpers de Teste

**Localização:** `mobile/src/test/helpers.tsx`

**Funcionalidades:**
- `renderWithProviders()` - Renderiza componentes com providers necessários
- `mockAuthState()` - Mocka estado de autenticação
- `mockApiResponse()` - Mocka respostas da API
- `mockApiError()` - Mocka erros da API
- `generateMockToken()` - Gera token JWT mock
- `decodeMockToken()` - Decodifica token mock
- `setupAsyncStorageMock()` - Setup mock do AsyncStorage
- `clearAllMocks()` - Limpa todos os mocks
- `createMockUser()` - Cria usuário mock
- `createMockChurch()` - Cria igreja mock
- `createMockBranch()` - Cria branch mock
- `createMockMember()` - Cria member mock

**Exemplo de uso:**
```typescript
import { renderWithProviders, mockAuthState, generateMockToken } from '../../test/helpers'

const token = generateMockToken({
  sub: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  onboardingCompleted: true,
})

mockAuthState({
  token,
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    onboardingCompleted: true,
  },
})

renderWithProviders(<MyComponent />, { authState: { token, user: {...} } })
```

### Web: Helpers de Teste

**Localização:** `web/src/test/helpers.tsx`

**Funcionalidades:**
- Similar ao mobile, adaptado para web (React Testing Library)

### E2E: Helpers

**Backend E2E:**
- `web/src/__tests__/e2e/helpers/apiHelpers.ts` - Helpers para chamadas reais à API
- `web/src/__tests__/e2e/helpers/testHelpers.tsx` - Helpers para testes E2E com UI

---

## 📊 Matriz de Testes Implementados

### Backend

| Módulo/Endpoint | Unit | Integration | E2E | Status |
|----------------|------|-------------|-----|--------|
| `OnboardingProgressService` | ✅ 6+ | - | - | ✅ Completo |
| `GET /onboarding/progress` | - | ✅ 7 | - | ✅ Completo |
| `POST /onboarding/progress/:step` | - | ✅ 7 | - | ✅ Completo |
| `POST /onboarding/complete` | - | ✅ 7 | - | ✅ Completo |
| `POST /churches` (idempotency) | - | ✅ 7 | - | ✅ Completo |
| `POST /auth/login` (onboardingCompleted) | ⚠️ | ⚠️ | - | ⚠️ Parcial |
| `ChurchService` | ⚠️ | - | - | ⚠️ Parcial |

### Mobile

| Componente/Fluxo | Unit | Integration | E2E | Status |
|------------------|------|-------------|-----|--------|
| `AuthStore` (onboardingCompleted) | ✅ 5+ | - | - | ✅ Completo |
| `AppNavigator` (guard) | - | ✅ 6 | - | ✅ Completo |
| `ChurchScreen` (ownership validation) | ⚠️ | ⚠️ | - | ⚠️ Pendente |
| `Onboarding Flow` | - | ⚠️ | ⚠️ | ⚠️ Parcial |

### Web

| Componente/Fluxo | Unit | Integration | E2E | Status |
|------------------|------|-------------|-----|--------|
| `AuthStore` (onboardingCompleted) | ⚠️ | - | - | ⚠️ Pendente |
| `ProtectedRoute` (guard) | ⚠️ | ⚠️ | - | ⚠️ Parcial |
| `Onboarding Flow` | ⚠️ | ⚠️ | ⚠️ | ⚠️ Parcial |

### E2E Scenarios

| Cenário | Backend | Mobile | Web | Status |
|---------|---------|--------|-----|--------|
| Register → onboarding → Main | ⚠️ | ⚠️ | ⚠️ | ⚠️ Parcial |
| Abandon → resume PENDING | ⚠️ | ⚠️ | ⚠️ | ⚠️ Pendente |
| Idempotency (duplo submit) | ✅ | ⚠️ | ⚠️ | ⚠️ Parcial |
| Invite join válido/inválido | ⚠️ | ⚠️ | ⚠️ | ⚠️ Pendente |
| 401 handling (logout/reset) | ⚠️ | ⚠️ | ⚠️ | ⚠️ Pendente |

**Legenda:**
- ✅ Completo: Todos os testes obrigatórios implementados
- ⚠️ Parcial: Alguns testes implementados, mas não todos
- ❌ Pendente: Não implementado

---

## 🚀 Como Executar os Testes

### Backend

```bash
cd backend
npm test                                    # Todos os testes
npm test -- unit                            # Apenas unit tests
npm test -- integration                     # Apenas integration tests
npm test -- e2e                             # Apenas E2E tests
npm test -- onboardingProgressService       # Teste específico
npm test -- onboardingProgress              # Teste específico
```

**Requisitos:**
- PostgreSQL rodando
- Banco de dados `churchapp_test` criado
- Arquivo `.env.test` configurado com `DATABASE_URL`

### Mobile

```bash
cd mobile
npm test                                    # Todos os testes
npm test -- __tests__/unit                  # Apenas unit tests
npm test -- __tests__/integration           # Apenas integration tests
npm test -- authStore                       # Teste específico
```

**Requisitos:**
- Jest configurado (já configurado)
- AsyncStorage mock configurado (já configurado)

### Web

```bash
cd web
npm test                                    # Todos os testes
npm test -- unit                            # Apenas unit tests
npm test -- integration                     # Apenas integration tests
npm test -- e2e                             # Apenas E2E tests
```

**Requisitos:**
- Vitest configurado (já configurado)

---

## 📝 Como Adicionar Novos Testes

### Template: Unit Test Backend

**IMPORTANTE:** Testes unitários devem usar apenas mocks, não banco de dados real.

```typescript
// backend/tests/unit/[module].test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { [Service] } from '../../src/services/[service]'
import { prisma } from '../../src/lib/prisma'

// Mock do Prisma - obrigatório em testes unitários
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    [model]: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      // ... outros métodos necessários
    },
  },
}))

describe('[Service] - Unit Tests', () => {
  let service: [Service]
  const mockUserId = 'user-test-123' // ID mock - não usar banco real

  beforeEach(() => {
    service = new [Service]()
    vi.clearAllMocks()
    // NÃO chamar resetTestDatabase() ou createTestUser() em testes unitários
    // Isso é apenas para integration tests
  })

  // Teste 1: Success
  it('deve [descrição do sucesso]', async () => {
    // Given - Configurar mocks
    ;(prisma.[model].findUnique as any).mockResolvedValue(null)
    ;(prisma.[model].create as any).mockResolvedValue({ id: 'test-id', ... })

    // When - Executar método do service
    const result = await service.[method](mockUserId)

    // Then - Verificar resultado e chamadas
    expect(result).toBeDefined()
    expect(prisma.[model].create).toHaveBeenCalled()
  })

  // Teste 2: Validation failure
  it('deve [descrição da falha de validação]', async () => {
    // Given - Configurar mocks para cenário de falha
    // When - Executar método
    // Then - Verificar erro
  })

  // Teste 3: Forbidden/Unauthorized (quando aplicável)
  // Teste 4: Edge case #1
  // Teste 5: Edge case #2
  // Teste 6: Dependency failure propagation
  it('deve propagar erro se dependência falhar', async () => {
    const dbError = new Error('Database connection failed')
    ;(prisma.[model].findUnique as any).mockRejectedValue(dbError)
    await expect(service.[method](mockUserId)).rejects.toThrow(dbError)
  })
})
```

### Template: Integration Test Backend

```typescript
// backend/tests/integration/[endpoint].test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, createTestUserWithSubscription, generateTestToken } from '../utils/testFactories'
import { resetTestDatabase } from '../utils/resetTestDatabase'

describe('[Endpoint] - Integration Tests', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>
  let testUser: Awaited<ReturnType<typeof createTestUserWithSubscription>>
  let userToken: string

  beforeAll(async () => {
    app = await createTestApp()
  })

  beforeEach(async () => {
    await resetTestDatabase()
    testUser = await createTestUserWithSubscription()
    userToken = await generateTestToken(app, { sub: testUser.user.id, ... })
  })

  afterAll(async () => {
    await app.close()
    await resetTestDatabase()
  })

  // Teste 1: 200/201 Success
  it('deve [descrição do sucesso]', async () => {
    // Given
    // When
    // Then
  })

  // Teste 2: 400 Invalid payload
  // Teste 3: 401 Unauthenticated
  // Teste 4: 403 Forbidden (quando aplicável)
  // Teste 5: 409 Conflict/Idempotency (quando aplicável)
  // Teste 6: 422 Business rule
  // Teste 7: DB side-effect assertions
})
```

### Template: Unit Test UI Mobile

```typescript
// mobile/src/__tests__/unit/[component].test.tsx
import { describe, it, expect, beforeEach } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { renderWithProviders, mockAuthState } from '../../../test/helpers'
import [Component] from '../../../[path]/[Component]'

describe('[Component] - Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks
  })

  // Teste 1: Basic render
  it('deve renderizar corretamente', () => {
    // Given
    // When
    // Then
  })

  // Teste 2: Loading state
  // Teste 3: Error state + retry
  // Teste 4: Empty state
  // Teste 5: Primary interaction
})
```

### Template: Integration Test UI Mobile

```typescript
// mobile/src/__tests__/integration/[flow].test.tsx
import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders, mockAuthState, mockApiResponse } from '../../../test/helpers'

describe('[Flow] - Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
  })

  // Teste 1: Route guard baseado em NEW/PENDING/COMPLETE
  // Teste 2: Onboarding prefill quando PENDING
  // Teste 3: Submit updates token/store
  // Teste 4: Backend error shows feedback
  // Teste 5: Retry/refresh works
  // Teste 6: Invalid action is blocked
})
```

---

## 🎯 Cobertura de Testes

### Cobertura Atual (Estimada)

**Backend:**
- Unit tests: ~60% dos módulos críticos
- Integration tests: ~70% dos endpoints críticos
- E2E tests: ~40% dos cenários críticos

**Mobile:**
- Unit tests: ~50% dos componentes críticos
- Integration tests: ~40% dos fluxos críticos
- E2E tests: ~20% dos cenários críticos

**Web:**
- Unit tests: ~40% dos componentes críticos
- Integration tests: ~50% dos fluxos críticos
- E2E tests: ~30% dos cenários críticos

### Meta de Cobertura

- **Unit tests:** >80% (linha)
- **Integration tests:** >70% (endpoint/fluxo)
- **E2E tests:** >50% (cenários críticos)

---

## 🔧 Setup de Ferramentas E2E

### E2E Tooling Setup Needed

**Backend E2E:**
- ✅ Implementado usando Supertest
- Configuração: `backend/vitest.config.ts`

**Web E2E:**
- ✅ Implementado usando Vitest + React Testing Library
- ⚠️ Playwright disponível mas não configurado para Account Flow
- **Setup necessário:**
  1. Instalar Playwright: `npm install -D @playwright/test`
  2. Configurar `playwright.config.ts`
  3. Adicionar testes E2E específicos para Account Flow

**Mobile E2E:**
- ❌ Detox não configurado
- ❌ Maestro não configurado
- **Setup necessário:**
  1. Escolher ferramenta: Detox ou Maestro
  2. Instalar e configurar
  3. Adicionar testes E2E específicos para Account Flow

---

## 📚 Referências e Documentação Relacionada

- `docs/ai/ACCOUNT_CREATION_FLOW_REPORT.md` - Relatório do fluxo de criação de conta
- `docs/ai/ACCOUNT_FLOW_IMPROVEMENT_PLAN.md` - Plano de melhorias
- `docs/ai/ACCOUNT_FLOW_TEST_AUDIT_REPORT.md` - Relatório de auditoria de testes

---

## ✅ Checklist de Qualidade

Antes de considerar um teste completo, verificar:

- [ ] Todos os testes obrigatórios implementados (6 para unit backend, 7 para integration backend, etc.)
- [ ] **Unit tests usam apenas mocks (não banco real)**
- [ ] **Integration tests usam banco real com `resetTestDatabase()`**
- [ ] Testes seguem padrão Given/When/Then
- [ ] Testes são determinísticos (mock time/date quando necessário)
- [ ] Testes usam factories/helpers reutilizáveis
- [ ] Testes validam tanto caminhos positivos quanto negativos
- [ ] Testes não têm duplicação (reutilizam helpers)
- [ ] Nomes de testes são claros e descritivos
- [ ] Testes cobrem edge cases relevantes
- [ ] Testes validam efeitos colaterais no banco (apenas integration tests)
- [ ] Testes podem ser executados de forma independente

### Diferença entre Unit e Integration Tests

**Unit Tests:**
- ✅ Usam apenas mocks do Prisma
- ✅ Não chamam `resetTestDatabase()` ou `createTestUser()`
- ✅ Usam IDs mock (ex: `const mockUserId = 'user-test-123'`)
- ✅ Focam na lógica do service isoladamente
- ✅ Executam rápido (sem I/O real)

**Integration Tests:**
- ✅ Usam banco de dados real
- ✅ Chamam `resetTestDatabase()` no `beforeEach`
- ✅ Usam `createTestUser()` ou factories para criar dados reais
- ✅ Testam interação entre componentes + banco
- ✅ Executam mais lento (com I/O real)

---

## 🐛 Troubleshooting

### Backend: Erro de conexão com banco

**Problema:** Testes falham com erro de conexão ao banco.

**Solução:**
1. Verificar que PostgreSQL está rodando
2. Verificar que banco `churchapp_test` existe
3. Verificar arquivo `.env.test` tem `DATABASE_URL` correta
4. Executar: `cd backend && npx prisma db push --force-reset` (cuidado: limpa banco)

**Nota:** Testes unitários não precisam de banco real - apenas integration tests.

### Backend: Erro "Cannot read properties of undefined (reading 'deleteMany')" em testes unitários

**Problema:** Teste unitário tenta usar banco real mas Prisma está mockado.

**Causa:** Teste unitário está chamando `resetTestDatabase()` ou `createTestUser()` que usam Prisma real, mas Prisma está mockado.

**Solução:**
1. Remover `resetTestDatabase()` do `beforeEach` em testes unitários
2. Remover `createTestUser()` e usar apenas IDs mock
3. Usar apenas mocks do Prisma em testes unitários
4. Banco real é apenas para integration tests

**Exemplo correto:**
```typescript
// Unit test - usa apenas mocks
vi.mock('../../src/lib/prisma', () => ({ ... }))
const mockUserId = 'user-test-123' // Não criar usuário real

beforeEach(() => {
  vi.clearAllMocks()
  // NÃO chamar resetTestDatabase() ou createTestUser()
})
```

**Exemplo errado:**
```typescript
// Unit test - ERRADO: mistura mocks com banco real
vi.mock('../../src/lib/prisma', () => ({ ... }))

beforeEach(async () => {
  await resetTestDatabase() // ❌ ERRO: Prisma está mockado
  testUser = await createTestUser() // ❌ ERRO: Prisma está mockado
})
```

### Mobile: AsyncStorage não funciona

**Problema:** Testes falham ao acessar AsyncStorage.

**Solução:**
1. Verificar que mock está configurado em `mobile/src/test/setup.ts`
2. Usar `setupAsyncStorageMock()` do `mobile/src/test/helpers.tsx`

### Web: API mock não funciona

**Problema:** Testes falham porque API mock não está funcionando.

**Solução:**
1. Verificar que `vi.mock('../api/api')` está presente
2. Usar `mockApiResponse()` ou `mockApiError()` do `web/src/test/helpers.tsx`

---

## 📅 Próximos Passos

1. ✅ Criar factories/builders reutilizáveis
2. ✅ Implementar testes unitários backend (OnboardingProgressService)
3. ✅ Implementar testes integration backend (onboarding endpoints)
4. ⚠️ Completar testes integration backend (auth endpoints com onboardingCompleted)
5. ⚠️ Implementar testes unitários UI mobile completos (ChurchScreen)
6. ⚠️ Implementar testes E2E completos (5 cenários)
7. ⚠️ Configurar ferramentas E2E (Detox/Maestro para mobile, Playwright para web)
8. ✅ Gerar documentação completa

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA  
**Versão:** 1.0

