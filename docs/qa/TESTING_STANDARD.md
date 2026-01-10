# Padrão Canônico de Testes - ChurchApp Complete

**Data:** 2025-02-01  
**Versão:** 1.0  
**Status:** Padrão Oficial  
**Aplicação:** Backend, Mobile, Web, Web-Admin

---

## 📋 Sumário Executivo

Este documento define o padrão canônico e obrigatório para testes em todo o projeto ChurchApp Complete. Todos os testes devem seguir este padrão para garantir consistência, qualidade e manutenibilidade.

**Documentos relacionados:**
- `docs/qa/ACCOUNT_FLOW_TESTING_STANDARD.md` - Padrões específicos para Account Flow
- `docs/qa/TESTING_BASELINE_REPORT.md` - Estado atual da infraestrutura de testes

---

## 1️⃣ Definições: Unit vs Integration vs E2E

### Backend

#### Unit Tests
**Definição:** Testes isolados que validam lógica de negócio de um módulo/serviço específico, usando apenas mocks.

**Características:**
- ❌ NÃO usam banco de dados real
- ❌ NÃO usam HTTP real
- ✅ Usam mocks do Prisma
- ✅ Testam apenas a lógica do service/utility isoladamente
- ✅ Executam rápido (< 100ms por teste)

**Localização:** `backend/tests/unit/**/*.test.ts`

**Exemplo de escopo:**
- `authService.test.ts` - Testa lógica de autenticação
- `churchService.test.ts` - Testa lógica de criação de igreja
- `onboardingProgressService.test.ts` - Testa lógica de progresso de onboarding

---

#### Integration Tests
**Definição:** Testes que validam interação entre componentes e banco de dados, usando banco real.

**Características:**
- ✅ Usam banco de dados real (via `.env.test`)
- ✅ Usam HTTP real (Supertest)
- ✅ Testam endpoints completos (controller + service + DB)
- ✅ Validam efeitos colaterais no banco
- ✅ Executam mais lento (< 2s por teste)

**Localização:** `backend/tests/integration/**/*.test.ts`

**Exemplo de escopo:**
- `authRoutes.test.ts` - Testa endpoint `/auth/login`
- `churchCreation.test.ts` - Testa endpoint `POST /churches`
- `onboardingProgress.test.ts` - Testa endpoints de onboarding

---

#### E2E Tests (End-to-End)
**Definição:** Testes que validam fluxos completos do sistema, simulando comportamento real do usuário.

**Características:**
- ✅ Usam banco de dados real
- ✅ Usam HTTP real
- ✅ Testam fluxos completos (múltiplos endpoints em sequência)
- ✅ Validam estado final no banco após fluxo completo
- ✅ Executam mais lentamente (< 5s por teste)

**Localização:** `backend/tests/e2e/**/*.test.ts`

**Exemplo de escopo:**
- `complete-flow.test.ts` - Registro → Onboarding → Criação de recursos
- `permissions-by-action.test.ts` - Fluxo completo de permissões

---

### UI (Mobile/Web/Web-Admin)

#### Unit Tests
**Definição:** Testes isolados que validam comportamento de componentes/screens/stores individuais, usando mocks.

**Características:**
- ❌ NÃO usam API real
- ❌ NÃO usam navegação real
- ✅ Usam mocks de API client
- ✅ Testam renderização, estados, interações
- ✅ Executam rápido (< 200ms por teste)

**Localização:**
- Mobile: `mobile/src/__tests__/unit/**/*.test.{ts,tsx}`
- Web: `web/src/__tests__/unit/**/*.test.{ts,tsx}`
- Web-Admin: `web-admin/src/__tests__/unit/**/*.test.{ts,tsx}`

**Exemplo de escopo:**
- `authStore.test.ts` - Testa store de autenticação
- `Login.test.tsx` - Testa componente de login
- `ChurchScreen.test.tsx` - Testa screen de igreja

---

#### Integration Tests
**Definição:** Testes que validam interação entre componentes, stores, navegação e API mockada.

**Características:**
- ✅ Usam API mockada (mas simula fluxo completo)
- ✅ Usam navegação mockada
- ✅ Testam fluxos de usuário (cliques, navegação, estados)
- ✅ Validam chamadas de API e atualizações de store
- ✅ Executam moderadamente (< 1s por teste)

**Localização:**
- Mobile: `mobile/src/__tests__/integration/**/*.test.{ts,tsx}`
- Web: `web/src/__tests__/integration/**/*.test.{ts,tsx}`
- Web-Admin: `web-admin/src/__tests__/integration/**/*.test.{ts,tsx}`

**Exemplo de escopo:**
- `onboarding-flow.test.tsx` - Fluxo completo de onboarding (mockado)
- `navigation/protected-routes.test.tsx` - Guards de navegação
- `AppNavigator.test.tsx` - Navegação baseada em estado

---

#### E2E Tests (End-to-End)
**Definição:** Testes que validam fluxos completos usando API real ou browser automation.

**Características:**
- ✅ Usam API real (backend deve estar rodando)
- ✅ Web-Admin: Usa Playwright (browser automation)
- ✅ Mobile: ⚠️ Não configurado (Detox/Maestro pendente)
- ✅ Testam fluxos completos do ponto de vista do usuário
- ✅ Executam mais lentamente (< 10s por teste)

**Localização:**
- Backend: `backend/tests/e2e/**/*.test.ts` (HTTP real)
- Web: `web/src/__tests__/e2e/**/*.test.{ts,tsx}` (HTTP real)
- Web-Admin: `web-admin/src/__tests__/e2e/**/*.spec.ts` (Playwright)
- Mobile: ❌ Não configurado (ver `mobile/e2e/README.md` para planejamento)

**Exemplo de escopo:**
- Web: `complete-flow.test.tsx` - Registro → Onboarding → Uso do app (API real)
- Web-Admin: `admin-login-flow.spec.ts` - Login admin via browser (Playwright)

---

## 2️⃣ Mínimo Obrigatório de Testes por Módulo

### Backend - Unit Tests

**Mínimo:** 6 testes por módulo crítico

**Padrão obrigatório:**
1. **Success** - Caso de sucesso básico
2. **Validation failure** - Falha de validação
3. **Forbidden/Unauthorized** - Quando aplicável (403/401)
4. **Edge case #1** - Datas/limites/null
5. **Edge case #2** - Estado inconsistente
6. **Dependency failure propagation** - Propagação de erros de dependências

**Exemplo:**
```typescript
describe('OnboardingProgressService - Unit Tests', () => {
  // Teste 1: Success
  it('deve criar progresso se não existe', async () => { ... })
  
  // Teste 2: Validation failure
  it('deve lançar erro se parâmetro inválido', async () => { ... })
  
  // Teste 3: Forbidden/Unauthorized (quando aplicável)
  // Teste 4: Edge case #1
  it('deve tratar null/undefined corretamente', async () => { ... })
  
  // Teste 5: Edge case #2
  it('deve tratar estado inconsistente', async () => { ... })
  
  // Teste 6: Dependency failure propagation
  it('deve propagar erro se dependência falhar', async () => { ... })
})
```

---

### UI - Unit Tests

**Mínimo:** 5 testes por componente/screen crítico

**Padrão obrigatório:**
1. **Basic render** - Renderização básica
2. **Loading state** - Estado de carregamento
3. **Error state + retry** - Estado de erro e retry
4. **Empty state** - Estado vazio (manter tabs/header visíveis quando aplicável)
5. **Primary interaction** - Interação principal (submit/click chama handler/action correto)

**Exemplo:**
```typescript
describe('LoginScreen - Unit Tests', () => {
  // Teste 1: Basic render
  it('deve renderizar corretamente', () => { ... })
  
  // Teste 2: Loading state
  it('deve mostrar loading durante autenticação', () => { ... })
  
  // Teste 3: Error state + retry
  it('deve mostrar erro e permitir retry', () => { ... })
  
  // Teste 4: Empty state
  it('deve renderizar campos vazios inicialmente', () => { ... })
  
  // Teste 5: Primary interaction
  it('deve chamar handleSubmit ao clicar em entrar', () => { ... })
})
```

---

### Backend - Integration Tests

**Mínimo:** 7 testes por endpoint crítico

**Padrão obrigatório:**
1. **200/201 Success** - Caso de sucesso
2. **400 Invalid payload** - Payload inválido
3. **401 Unauthenticated** - Não autenticado
4. **403 Forbidden** - Quando aplicável (sem permissão/role)
5. **409 Conflict/Idempotency** - Quando aplicável (duplicação)
6. **422 Business rule** - Regra de negócio (expired invite, maxMembers, etc.)
7. **DB side-effect assertions** - Assertivas de efeitos colaterais no banco

**Exemplo:**
```typescript
describe('POST /churches - Integration Tests', () => {
  // Teste 1: 200/201 Success
  it('deve criar igreja com sucesso (201 Created)', async () => { ... })
  
  // Teste 2: 400 Invalid payload
  it('deve retornar 400 se nome não fornecido', async () => { ... })
  
  // Teste 3: 401 Unauthenticated
  it('deve retornar 401 se usuário não autenticado', async () => { ... })
  
  // Teste 4: 403 Forbidden (quando aplicável)
  // Teste 5: 409 Conflict/Idempotency
  it('deve retornar igreja existente se createdByUserId já existe (200 OK)', async () => { ... })
  
  // Teste 6: 422 Business rule
  it('deve retornar 422 se exceder maxBranches do plano', async () => { ... })
  
  // Teste 7: DB side-effect assertions
  it('deve criar Branch e Member no banco ao criar igreja', async () => { ... })
})
```

---

### UI - Integration Tests

**Mínimo:** 6 testes por fluxo crítico

**Padrão obrigatório:**
1. **Route guard baseado em estado** - Guard de navegação (NEW/PENDING/COMPLETE)
2. **Prefill quando aplicável** - Preenchimento automático (ex: onboarding PENDING)
3. **Submit updates token/store** - Atualização de token/store após submit
4. **Backend error shows feedback** - Feedback de erro do backend
5. **Retry/refresh works** - Retry/refresh funciona
6. **Invalid action is blocked** - Ações inválidas bloqueadas (ex: duplicar igreja)

**Exemplo:**
```typescript
describe('AppNavigator - Guard Integration Tests', () => {
  // Teste 1: Route guard baseado em estado
  it('deve bloquear acesso a Main sem onboardingCompleted = true', () => { ... })
  
  // Teste 2: Prefill quando aplicável
  it('deve preencher dados se onboarding PENDING', () => { ... })
  
  // Teste 3: Submit updates token/store
  it('deve atualizar token após completar onboarding', () => { ... })
  
  // Teste 4: Backend error shows feedback
  it('deve mostrar erro se backend retornar 400', () => { ... })
  
  // Teste 5: Retry/refresh works
  it('deve permitir retry após erro', () => { ... })
  
  // Teste 6: Invalid action is blocked
  it('deve bloquear criação de segunda igreja', () => { ... })
})
```

---

### E2E Tests

**Mínimo:** 5 cenários críticos não sobrepostos + 1 por novo fluxo crítico

**Padrão obrigatório:**
1. **Fluxo principal happy path** (inclui negativo: campo obrigatório)
2. **Resumo/Retry de fluxo** (inclui negativo: bloqueio de duplicação)
3. **Idempotência** (inclui negativo: não cria duplicatas)
4. **Validação de regra de negócio** (ex: expired invite, maxMembers, etc.)
5. **Tratamento de erro crítico** (ex: 401 → logout + reset)

**Exemplo:**
```typescript
describe('E2E: Account Flow Completo', () => {
  // Cenário 1: Fluxo principal happy path
  it('deve completar: register → onboarding → main access', async () => {
    // Given: Usuário novo
    // When: Registra → completa onboarding
    // Then: Acesso ao Main App
    
    // Negativo: Campo obrigatório
    it('deve falhar se campo obrigatório ausente', async () => { ... })
  })
  
  // Cenário 2: Resumo/Retry de fluxo
  it('deve resumir onboarding se PENDING', async () => {
    // Given: Onboarding abandonado
    // When: Retoma onboarding
    // Then: Prefill correto e continuação
    
    // Negativo: Bloqueio de duplicação
    it('deve bloquear nova igreja se já existe', async () => { ... })
  })
  
  // Cenário 3: Idempotência
  it('deve ser idempotente: duplo submit não cria duplicatas', async () => { ... })
  
  // Cenário 4: Validação de regra de negócio
  it('deve validar expired invite (end-of-day)', async () => { ... })
  
  // Cenário 5: Tratamento de erro crítico
  it('deve fazer logout e reset em 401', async () => { ... })
})
```

**Novos fluxos críticos:** Adicionar 1 teste E2E adicional por novo fluxo crítico identificado.

---

## 3️⃣ Convenções Obrigatórias de Estrutura

### AAA (Arrange-Act-Assert) para Unit Tests

**Padrão obrigatório:** Todos os testes unit devem seguir o padrão AAA.

**Formato:**
```typescript
it('deve [descrição do comportamento]', () => {
  // Arrange (Given) - Setup do teste
  const mockData = createMockData()
  mockApiResponse('get', { data: mockData })
  
  // Act (When) - Execução da ação
  const result = service.doSomething(mockData)
  
  // Assert (Then) - Verificação do resultado
  expect(result).toBeDefined()
  expect(result.value).toBe(expectedValue)
})
```

**Exemplo real:**
```typescript
it('deve criar progresso se não existe', async () => {
  // Arrange
  const userId = 'user-test-123'
  ;(prisma.onboardingProgress.findUnique as any).mockResolvedValue(null)
  ;(prisma.onboardingProgress.create as any).mockResolvedValue({
    id: 'progress-1',
    userId,
    churchConfigured: false,
  })
  
  // Act
  const progress = await service.getOrCreateProgress(userId)
  
  // Assert
  expect(progress.userId).toBe(userId)
  expect(prisma.onboardingProgress.create).toHaveBeenCalled()
})
```

---

### Given/When/Then para Integration e E2E Tests

**Padrão obrigatório:** Todos os testes de integration e E2E devem usar comentários Given/When/Then.

**Formato:**
```typescript
it('deve [descrição do comportamento]', async () => {
  // Given - Estado inicial do sistema
  const user = await createTestUser()
  const token = await generateTestToken(user)
  
  // When - Ação executada
  const response = await request(app.server)
    .post('/churches')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Igreja Nova' })
  
  // Then - Estado final e verificações
  expect(response.status).toBe(201)
  expect(response.body.church).toBeDefined()
  
  // Verificação no banco (quando aplicável)
  const church = await prisma.church.findUnique({
    where: { id: response.body.church.id }
  })
  expect(church).not.toBeNull()
})
```

**Exemplo real:**
```typescript
it('deve retornar igreja existente quando createdByUserId já existe', async () => {
  // Given - Primeira igreja criada
  const response1 = await request(app.server)
    .post('/churches')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Igreja Teste' })
  const churchId1 = response1.body.church.id
  
  // When - Tentativa de criar segunda igreja
  const response2 = await request(app.server)
    .post('/churches')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ name: 'Igreja Teste 2' })
  
  // Then - Retorna igreja existente
  expect(response2.status).toBe(200)
  expect(response2.body.church.id).toBe(churchId1)
})
```

---

## 4️⃣ Estrutura de Pastas Padrão

### Backend

**Estrutura obrigatória:**
```
backend/tests/
├── setupTestEnv.ts              # Setup global (não modificar sem aprovação)
├── unit/
│   ├── [feature].test.ts        # Testes unit por feature
│   └── admin/                   # Testes unit de admin (se aplicável)
│       └── [feature].test.ts
├── integration/
│   ├── [feature]Routes.test.ts  # Testes de endpoint por feature
│   └── admin/                   # Testes integration de admin (se aplicável)
│       └── [feature]Routes.test.ts
├── e2e/
│   ├── [flow].test.ts           # Testes E2E por fluxo
│   └── helpers/                 # Helpers E2E
│       └── testHelpers.ts
└── utils/                       # Helpers reutilizáveis
    ├── testFactories.ts         # Factories obrigatórias
    ├── resetTestDatabase.ts     # Reset de banco
    ├── seedTestDatabase.ts      # Seed de dados
    └── [outros helpers]
```

**Padrão de nomenclatura:**
- Unit: `[feature][Service].test.ts` (ex: `authService.test.ts`)
- Integration: `[feature][Routes].test.ts` (ex: `authRoutes.test.ts`)
- E2E: `[flow-name].test.ts` (ex: `complete-flow.test.ts`)

---

### Mobile

**Estrutura obrigatória:**
```
mobile/src/__tests__/
├── unit/
│   ├── api/
│   │   └── [api].test.ts        # Testes unit de API client
│   ├── components/
│   │   └── [Component].test.tsx # Testes unit de componentes
│   ├── screens/
│   │   └── [Screen].test.tsx    # Testes unit de screens
│   └── stores/
│       └── [Store].test.ts      # Testes unit de stores
├── integration/
│   ├── navigation/
│   │   └── [Navigator].test.tsx # Testes integration de navegação
│   └── [feature]/               # Testes integration por feature
│       └── [flow].test.tsx
└── (setup em mobile/src/test/)
    ├── setup.ts                 # Setup global
    └── helpers.tsx              # Helpers reutilizáveis
```

**Padrão de nomenclatura:**
- Unit: `[Component/Screen/Store][Name].test.{ts,tsx}`
- Integration: `[feature]/[flow].test.{ts,tsx}` ou `[Navigator].test.tsx`

**Nota:** E2E não configurado ainda (ver `mobile/e2e/README.md`).

---

### Web

**Estrutura obrigatória:**
```
web/src/__tests__/
├── unit/
│   ├── api/
│   │   └── [api].test.ts        # Testes unit de API client
│   ├── components/
│   │   └── [Component].test.tsx # Testes unit de componentes
│   ├── pages/
│   │   └── [Page].test.tsx      # Testes unit de páginas
│   └── stores/
│       └── [Store].test.ts      # Testes unit de stores
├── integration/
│   ├── auth/
│   ├── navigation/
│   ├── [feature]/               # Testes integration por feature
│   │   └── [flow].test.tsx
│   └── [outros fluxos]
├── e2e/
│   ├── [flow].test.tsx          # Testes E2E por fluxo
│   └── helpers/
│       ├── apiHelpers.ts        # Helpers para API real
│       └── testHelpers.tsx      # Helpers para testes E2E
└── (setup em web/src/test/)
    ├── setup.ts                 # Setup global
    └── helpers.tsx              # Helpers reutilizáveis
```

**Padrão de nomenclatura:**
- Unit: `[Component/Page/Store][Name].test.{ts,tsx}`
- Integration: `[feature]/[flow].test.{ts,tsx}`
- E2E: `[flow].test.tsx`

---

### Web-Admin

**Estrutura obrigatória:**
```
web-admin/src/__tests__/
├── unit/
│   ├── components/
│   │   └── [Component].test.tsx
│   ├── pages/
│   │   └── [Page].test.tsx
│   └── utils/
│       └── [util].test.ts
├── integration/
│   └── [feature]/
│       └── [flow].test.tsx
├── e2e/
│   └── [flow].spec.ts           # Playwright usa .spec.ts
└── mocks/
    ├── handlers.ts              # MSW handlers
    └── server.ts                # MSW server
```

**Padrão de nomenclatura:**
- Unit/Integration: `[Name].test.{ts,tsx}`
- E2E: `[Name].spec.ts` (Playwright)

---

## 5️⃣ Regras Obrigatórias de Reutilização

### Factories/Builders são Obrigatórios

**Regra:** Nunca criar entidades diretamente em testes. Sempre usar factories/builders.

**Backend - Factories obrigatórias:**

**Localização:** `backend/tests/utils/factories/` (recomendado) ou `backend/tests/utils/testFactories.ts` (legado)

**Factories disponíveis:**
- `createTestUser()` - Cria User
- `createTestPlan()` - Cria Plan
- `createTestSubscription()` - Cria Subscription
- `createTestChurch()` - Cria Church
- `createTestBranch()` - Cria Branch
- `createTestMember()` - Cria Member
- `createTestOnboardingProgress()` - Cria OnboardingProgress
- `createTestInviteLink()` - Cria InviteLink
- `createTestUserWithSubscription()` - Helper completo (User + Plan + Subscription)
- `createTestChurchSetup()` - Helper completo (User + Church + Branch + Member)

**Exemplo correto:**
```typescript
import { createTestUserWithSubscription } from '../utils/factories'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'

const testUser = await createTestUserWithSubscription()
const app = await createTestApp()
const token = await generateTestToken(app, { sub: testUser.user.id, ... })
```

**Backend - Helpers de infraestrutura:**

**Localização:** `backend/tests/utils/`

- `createTestApp.ts` - Cria instância Fastify para testes
- `auth.ts` - Helpers de autenticação (`generateTestToken`, `attachAuthHeader`, `createAuthHeaders`)
- `db.ts` - Helpers de banco de dados (`resetTestDatabase`)
- `time.ts` - Helpers de tempo (`freezeTime`, `unfreezeTime`, `advanceTime`)
- `factories/` - Factories de entidades (User, Plan, Church, etc.)

**Exemplo incorreto:**
```typescript
// ❌ ERRADO: Criar diretamente
const user = await prisma.user.create({ data: { email: 'test@example.com', ... } })

// ✅ CORRETO: Usar factory
const user = await createTestUser({ email: 'test@example.com' })
```

---

### Helpers são Obrigatórios

**Regra:** Não duplicar código de setup/configuração. Sempre usar helpers.

**Backend - Helpers disponíveis:**

**Localização:** `backend/tests/utils/`

- `resetTestDatabase()` - Reseta banco de teste (apenas integration/E2E)
- `seedTestDatabase()` - Cria dados de seed
- `testResponseHelper.ts` - Helpers para log de responses
- `testErrorHelper.ts` - Helpers para tratamento de erros

**Mobile - Helpers disponíveis:**

**Localização:** `mobile/src/test/`

- `renderWithProviders.tsx` - Renderiza com providers (NavigationContainer, AuthStore, AsyncStorage)
- `navigationHarness.tsx` - Helpers para testes de navegação (createNavigationHarness, mockNavigation, mockRoute)
- `mockApi.ts` - Mock consistente de API (mockApiResponse, mockApiError, resetApiMocks)
- `fixtures/index.ts` - Fixtures reutilizáveis (user, church, branch, member, event, etc.)
- `helpers.tsx` - Helpers legados (mantidos para backward compatibility)

**Web - Helpers disponíveis:**

**Localização:** `web/src/test/`

- `renderWithProviders.tsx` - Renderiza com providers (MemoryRouter, AuthStore, Toaster)
- `mockApi.ts` - Mock consistente de API (mockApiResponse, mockApiError, resetApiMocks)
- `fixtures/index.ts` - Fixtures reutilizáveis (user, church, branch, member, event, etc.)
- `helpers.tsx` - Helpers legados (mantidos para backward compatibility)
- `mocks/server.ts` - MSW server (se configurado)
- `mocks/handlers.ts` - MSW handlers (se configurado)

**Exemplo correto:**
```typescript
// Mobile
import { renderWithProviders } from '../../test/renderWithProviders'
import { fixtures } from '../../test/fixtures'

const { getByText } = renderWithProviders(<MyComponent />, {
  authState: {
    token: 'mock-token',
    user: fixtures.user(),
  },
})

// Web
import { renderWithProviders } from '../../test/renderWithProviders'
import { fixtures } from '../../test/fixtures'

const { getByText } = renderWithProviders(<MyComponent />, {
  initialEntries: ['/dashboard'],
  authState: {
    token: 'mock-token',
    user: fixtures.user(),
  },
})
```

---

## 6️⃣ Convenção de TestIDs

### Regra Obrigatória

Elementos críticos usados em testes E2E e integration devem ter `testID` (mobile) ou `data-testid` (web).

**Padrão mínimo:**
- Mobile: `testID="[screen]-[element-type]-[purpose]"`
- Web: `data-testid="[screen]-[element-type]-[purpose]"`

**Elementos que DEVEM ter testID:**
- Botões de submit/action críticos
- Inputs de formulários críticos
- Navigators principais
- Mensagens de erro/sucesso críticas
- Loading states

**Elementos que NÃO precisam:**
- Textos estáticos (usar `getByText`)
- Elementos decorativos
- Elementos não usados em testes

**Documentação completa:** `docs/qa/TESTID_CONVENTION.md`

**Exemplos:**

Mobile:
```tsx
<TouchableOpacity testID="login-submit-button">
  <Text>Entrar</Text>
</TouchableOpacity>
<TextInput testID="login-email-input" />
<View testID="onboarding-navigator">
```

Web:
```jsx
<button data-testid="login-submit-button">Entrar</button>
<input data-testid="login-email-input" />
<nav data-testid="main-navigator">
```

---

## 7️⃣ Regras de Determinismo

### Congelar Tempo quando Necessário

**Regra:** Testes que dependem de tempo devem usar time mocking.

**Backend:**
```typescript
import { freezeTime, unfreezeTime } from '../utils/time'

beforeEach(() => {
  freezeTime(new Date('2025-01-01T10:00:00Z'))
})

afterEach(() => {
  unfreezeTime()
})
```

**Mobile/Web:**
```typescript
import { jest } from '@jest/globals' // Mobile
import { vi } from 'vitest' // Web

beforeEach(() => {
  jest.useFakeTimers() // Mobile
  // ou
  vi.useFakeTimers() // Web
})
```

---

### Sem Network Real em Unit/Integration UI

**Regra:** Testes unit e integration UI devem usar API mockada, nunca network real.

**Exemplo correto:**
```typescript
import { mockApiResponse } from '../../test/helpers'

beforeEach(() => {
  mockApiResponse('get', { data: mockChurches })
})

it('deve carregar igrejas', async () => {
  // API é mockada, não faz chamada real
})
```

**Exemplo incorreto:**
```typescript
// ❌ ERRADO: Chamada real em unit/integration
const response = await api.get('/churches') // Sem mock
```

**Nota:** E2E pode usar network real (é o propósito deles).

---

### Fixtures Estáveis

**Regra:** Usar factories com dados estáveis, não timestamps aleatórios.

**Exemplo correto:**
```typescript
const testUser = await createTestUser({
  email: 'test@example.com', // Estável
  firstName: 'Test',
  lastName: 'User',
})
```

**Exemplo incorreto:**
```typescript
// ❌ ERRADO: Timestamp aleatório
const testUser = await createTestUser({
  email: `test-${Date.now()}@example.com`, // Não determinístico
})
```

**Nota:** Se precisar de dados únicos, usar sequências controladas ou factories que garantam unicidade de forma determinística.

---

## 8️⃣ Como Adicionar Novos Testes

### Template: Unit Test Backend

**Localização:** `backend/tests/unit/[feature][Service].test.ts`

**Template:**
```typescript
// Unit tests para [Service]
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { [Service] } from '../../src/services/[service]'
import { prisma } from '../../src/lib/prisma'

// Mock do Prisma - OBRIGATÓRIO em unit tests
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
    // ❌ NÃO chamar resetTestDatabase() ou createTestUser() em unit tests
  })

  // Teste 1: Success
  it('deve [descrição do sucesso]', () => {
    // Arrange
    ;(prisma.[model].findUnique as any).mockResolvedValue(null)
    
    // Act
    const result = await service.[method](mockUserId)
    
    // Assert
    expect(result).toBeDefined()
  })

  // Teste 2: Validation failure
  it('deve [descrição da falha de validação]', async () => { ... })
  
  // Teste 3: Forbidden/Unauthorized (quando aplicável)
  // Teste 4: Edge case #1
  // Teste 5: Edge case #2
  // Teste 6: Dependency failure propagation
})
```

**Referência:** `backend/tests/unit/onboardingProgressService.test.ts`

---

### Template: Integration Test Backend

**Localização:** `backend/tests/integration/[feature][Routes].test.ts`

**Template:**
```typescript
// Integration tests para [Endpoint]
// Padrão obrigatório: 7 testes por endpoint crítico
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestUserWithSubscription } from '../utils/factories'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'
import { resetTestDatabase } from '../utils/db'

describe('[Endpoint] - Integration Tests', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>
  let testUser: Awaited<ReturnType<typeof createTestUserWithSubscription>>
  let userToken: string

  beforeAll(async () => {
    app = await createTestApp()
  })

  beforeEach(async () => {
    await resetTestDatabase() // ✅ OBRIGATÓRIO em integration tests
    testUser = await createTestUserWithSubscription()
    userToken = await generateTestToken(app, {
      sub: testUser.user.id,
      email: testUser.user.email,
      name: `${testUser.user.firstName} ${testUser.user.lastName}`.trim(),
      type: 'user',
      onboardingCompleted: false,
    })
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

**Referência:** `backend/tests/integration/onboardingProgress.test.ts`

---

### Template: Unit Test UI (Mobile/Web)

**Localização:** `mobile/src/__tests__/unit/[Component/Screen/Store][Name].test.{ts,tsx}`

**Template:**
```typescript
// Unit tests para [Component/Screen/Store]
// Padrão obrigatório: 5 testes por componente crítico
import { describe, it, expect, beforeEach } from '@jest/globals' // Mobile
// ou
import { describe, it, expect, beforeEach } from 'vitest' // Web
import { render, screen } from '@testing-library/react-native' // Mobile
// ou
import { render, screen } from '@testing-library/react' // Web
import { renderWithProviders } from '../../test/renderWithProviders' // Mobile
// ou
import { renderWithProviders } from '../../test/renderWithProviders' // Web
import { resetApiMocks } from '../../test/mockApi'
import { fixtures } from '../../test/fixtures'
import [Component] from '../../[path]/[Component]'

describe('[Component] - Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetApiMocks()
  })

  // Teste 1: Basic render
  it('deve renderizar corretamente', () => {
    // Arrange
    const mockUser = fixtures.user()
    
    // Act
    const { getByText } = renderWithProviders(<Component />, {
      authState: {
        token: 'mock-token',
        user: mockUser,
      },
    })
    
    // Assert
    expect(getByText('Expected Text')).toBeDefined()
  })

  // Teste 2: Loading state
  // Teste 3: Error state + retry
  // Teste 4: Empty state
  // Teste 5: Primary interaction
})
```

**Referência:**
- Mobile: `mobile/src/__tests__/unit/stores/authStoreWithOnboarding.test.ts`
- Web: `web/src/__tests__/unit/pages/Login.test.tsx`

**Helpers:**
- Mobile: `mobile/src/test/renderWithProviders.tsx`, `mobile/src/test/fixtures/`
- Web: `web/src/test/renderWithProviders.tsx`, `web/src/test/fixtures/`

---

### Template: Integration Test UI (Mobile/Web)

**Localização:** `mobile/src/__tests__/integration/[feature]/[flow].test.{ts,tsx}`

**Template:**
```typescript
// Integration tests para [Flow]
// Padrão obrigatório: 6 testes por fluxo crítico
import { describe, it, expect, beforeEach } from '@jest/globals' // Mobile
// ou para Web:
// import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react-native' // Mobile
// ou para Web:
// import { render, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { mockApiResponse, mockApiError, resetApiMocks } from '../../test/mockApi'
import { fixtures } from '../../test/fixtures'

describe('[Flow] - Integration Tests', () => {
  beforeEach(() => {
    resetApiMocks()
  })

  // Teste 1: Route guard baseado em estado
  it('deve [descrição do guard]', () => {
    // Given
    const mockUser = fixtures.user({ onboardingCompleted: false })
    mockApiResponse('get', '/api/user', { data: { onboardingCompleted: false } })
    
    // When
    renderWithProviders(<AppNavigator />, {
      authState: {
        token: 'mock-token',
        user: mockUser,
      },
    })
    
    // Then
    expect(screen.getByTestId('onboarding-navigator')).toBeDefined()
  })

  // Teste 2: Prefill quando aplicável
  // Teste 3: Submit updates token/store
  // Teste 4: Backend error shows feedback
  // Teste 5: Retry/refresh works
  // Teste 6: Invalid action is blocked
})
```

**Referência:**
- Mobile: `mobile/src/__tests__/integration/navigation/AppNavigator.test.tsx`
- Web: `web/src/__tests__/integration/onboarding/onboarding-flow.test.tsx`

**Helpers:**
- Mobile: `mobile/src/test/renderWithProviders.tsx`, `mobile/src/test/navigationHarness.tsx`, `mobile/src/test/mockApi.ts`, `mobile/src/test/fixtures/`
- Web: `web/src/test/renderWithProviders.tsx`, `web/src/test/mockApi.ts`, `web/src/test/fixtures/`

---

### Template: E2E Test (Backend)

**Localização:** `backend/tests/e2e/[flow-name].test.ts`

**Template:**
```typescript
// E2E test para [Flow]
// Padrão: Validar fluxo completo do sistema
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../utils/testFactories'
import { resetTestDatabase } from '../utils/resetTestDatabase'

describe('E2E: [Flow Name]', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()
  })

  afterAll(async () => {
    await app.close()
    await resetTestDatabase()
  })

  it('deve [descrição do fluxo completo]', async () => {
    // Given - Estado inicial
    // When - Execução do fluxo completo
    // Then - Estado final e verificações no banco
  })
})
```

**Referência:** `backend/tests/e2e/complete-flow.test.ts`

---

### Template: E2E Test (Web - Vitest)

**Localização:** `web/src/__tests__/e2e/[flow].test.tsx`

**Template:**
```typescript
// E2E test para [Flow] - Web (API real)
// Padrão: Validar fluxo completo com backend real
import { describe, it, expect, beforeAll } from 'vitest'
import { registerUser, loginUser, createChurch } from './helpers/apiHelpers'

describe('E2E: [Flow Name]', () => {
  beforeAll(async () => {
    // Backend deve estar rodando em modo teste
    // Verificar que backend está acessível
  })

  it('deve [descrição do fluxo completo]', async () => {
    // Given - Estado inicial (registro, etc.)
    const registerResult = await registerUser({ ... })
    
    // When - Execução do fluxo completo
    const churchResult = await createChurch(registerResult.token, { ... })
    
    // Then - Verificações
    expect(churchResult.church).toBeDefined()
    expect(churchResult.member).toBeDefined()
  })
})
```

**Referência:** `web/src/__tests__/e2e/complete-flow.test.tsx`

---

### Template: E2E Test (Web-Admin - Playwright)

**Localização:** `web-admin/src/__tests__/e2e/[flow].spec.ts`

**Template:**
```typescript
// E2E test para [Flow] - Web-Admin (Playwright)
// Padrão: Validar fluxo completo via browser automation
import { test, expect } from '@playwright/test'

test.describe('E2E: [Flow Name]', () => {
  test('deve [descrição do fluxo completo]', async ({ page }) => {
    // Given - Estado inicial
    await page.goto('/login')
    
    // When - Interações do usuário
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Then - Verificações
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })
})
```

**Referência:** `web-admin/src/__tests__/e2e/admin-login-flow.spec.ts`

---

## 9️⃣ Scripts Disponíveis

### Backend

**Scripts reais disponíveis** (de `backend/package.json`):

```bash
# Todos os testes
npm test                              # Vitest (todos)

# Por tipo
npm run test:unit                     # Apenas unit
npm run test:integration              # Apenas integration
npm run test:e2e                      # Apenas E2E (com setup)

# Desenvolvimento
npm run test:watch                    # Watch mode
npm run test:report                   # Com cobertura

# Setup
npm run test:e2e:setup                # Setup banco E2E
npm run setup-test-db                 # Setup banco de teste

# Admin (específicos)
npm run test:admin:unit               # Admin unit
npm run test:admin:integration        # Admin integration
npm run test:admin:all                # Admin todos
```

**Nota:** Todos os scripts usam `dotenv-cli -e .env.test` automaticamente.

---

### Mobile

**Scripts reais disponíveis** (de `mobile/package.json`):

```bash
# Todos os testes
npm test                              # Jest (todos)

# Desenvolvimento
npm run test:watch                    # Watch mode
npm run test:coverage                 # Com cobertura
```

**⚠️ TODO:** Adicionar scripts separados para unit/integration/E2E quando E2E for configurado.

---

### Web

**Scripts reais disponíveis** (de `web/package.json`):

```bash
# Todos os testes
npm test                              # Vitest (todos)

# Por tipo
npm run test:unit                     # Apenas unit
npm run test:integration              # Apenas integration
npm run test:e2e                      # Apenas E2E

# Desenvolvimento
npm run test:watch                    # Watch mode
npm run test:ui                       # UI interativa
npm run test:coverage                 # Com cobertura
```

---

### Web-Admin

**Scripts reais disponíveis** (de `web-admin/package.json`):

```bash
# Vitest
npm test                              # Vitest (todos)
npm run test:unit                     # Apenas unit
npm run test:integration              # Apenas integration
npm run test:watch                    # Watch mode
npm run test:coverage                 # Com cobertura
npm run test:ui                       # UI interativa

# Playwright (E2E)
npm run test:admin:e2e                # Playwright E2E
npm run test:admin:e2e:ui             # Playwright com UI
```

---

## 🔟 Regras de Qualidade e Checklist

### Checklist Obrigatório antes de Commitar

Antes de considerar um teste completo, verificar:

**Estrutura:**
- [ ] Arquivo está na pasta correta (unit/integration/e2e)
- [ ] Nome segue padrão de nomenclatura
- [ ] Imports corretos (factories/helpers, não criação direta)

**Conteúdo:**
- [ ] Número mínimo de testes implementado (6 unit backend, 5 unit UI, 7 integration backend, 6 integration UI)
- [ ] Padrão AAA (unit) ou Given/When/Then (integration/E2E) seguido
- [ ] Usa factories/builders (não cria entidades diretamente)
- [ ] Usa helpers (não duplica código)
- [ ] Testes são determinísticos (sem timestamps aleatórios, time mocked se necessário)
- [ ] Unit tests usam apenas mocks (não banco real)
- [ ] Integration tests usam banco real (com resetTestDatabase)
- [ ] Validam caminhos positivos e negativos

**Nomenclatura:**
- [ ] Nomes de testes são claros e descritivos
- [ ] Seguem padrão: "deve [comportamento esperado]"
- [ ] Testes negativos seguem padrão: "deve [comportamento quando falha]"

**Isolamento:**
- [ ] Testes podem ser executados independentemente
- [ ] beforeEach/afterEach limpa estado corretamente
- [ ] Não há dependência de ordem entre testes

**Cobertura:**
- [ ] Edge cases relevantes cobertos
- [ ] Efeitos colaterais validados (quando aplicável em integration)
- [ ] Erros e exceções tratados

---

### Regras de Qualidade

1. **Não misturar tipos de teste:**
   - ❌ Unit test com banco real
   - ❌ Integration test sem banco real (quando deveria ter)

2. **Não duplicar código:**
   - ❌ Criar entidades diretamente
   - ❌ Duplicar setup entre testes
   - ✅ Usar factories e helpers

3. **Não tornar testes frágeis:**
   - ❌ Timestamps aleatórios
   - ❌ Dependência de ordem
   - ❌ Dados não determinísticos

4. **Não pular validações:**
   - ❌ Apenas caminho feliz
   - ❌ Não validar efeitos colaterais (integration)
   - ✅ Validar positivos e negativos

---

## 1️⃣1️⃣ Diferenças entre Tipos de Teste

### Resumo Rápido

| Característica | Unit | Integration | E2E |
|---------------|------|-------------|-----|
| **Banco de dados** | ❌ Mock | ✅ Real | ✅ Real |
| **API HTTP** | ❌ Mock | ✅ Real | ✅ Real |
| **Velocidade** | Rápido (< 100ms) | Médio (< 2s) | Lento (< 5-10s) |
| **Isolamento** | Alto | Médio | Baixo |
| **Setup** | Apenas mocks | Banco + app | Banco + app + browser |
| **Quando usar** | Lógica de negócio | Endpoints/Fluxos | Journey completo |
| **Padrão** | AAA | Given/When/Then | Given/When/Then |

### Quando Usar Cada Tipo

**Unit Tests:**
- Lógica de negócio complexa
- Utilities e helpers
- Validações e transformações
- Services isolados

**Integration Tests:**
- Endpoints HTTP completos
- Fluxos de UI com navegação
- Interação entre componentes
- Validação de side-effects

**E2E Tests:**
- Fluxos críticos completos
- Journey do usuário end-to-end
- Validação de integração completa
- Cenários de regressão críticos

---

## 📚 Referências e Documentação

### Documentação Relacionada

- `docs/qa/ACCOUNT_FLOW_TESTING_STANDARD.md` - Padrões específicos para Account Flow
- `docs/qa/TESTING_BASELINE_REPORT.md` - Estado atual da infraestrutura
- `backend/tests/README_TESTES.md` - Documentação de testes do backend
- `backend/tests/e2e/README.md` - Documentação de E2E do backend
- `web/src/__tests__/e2e/README.md` - Documentação de E2E do web
- `mobile/src/__tests__/integration/README.md` - Documentação de integration do mobile
- `mobile/e2e/README.md` - Documentação planejada de E2E do mobile

### Frameworks e Ferramentas

**Backend:**
- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

**Mobile:**
- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

**Web:**
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

**Web-Admin:**
- [Playwright Documentation](https://playwright.dev/)

---

## ✅ Validação e Aplicação

### Como Validar que Teste Segue o Padrão

1. **Verificar estrutura:** Arquivo está na pasta correta?
2. **Verificar nomenclatura:** Nome segue padrão?
3. **Verificar quantidade:** Tem número mínimo de testes?
4. **Verificar padrão:** Usa AAA (unit) ou Given/When/Then (integration/E2E)?
5. **Verificar reutilização:** Usa factories/helpers?
6. **Verificar determinismo:** Sem timestamps aleatórios?
7. **Verificar isolamento:** Não mistura mocks com banco real (unit)?

### Aplicação em Code Review

Todos os testes devem passar pelo checklist antes de aprovação:
- Revisar contra este padrão
- Validar que segue convenções
- Verificar que não duplica código
- Confirmar que cobre casos obrigatórios

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA  
**Versão:** 1.0  
**Status:** Padrão Oficial - Obrigatório

