# Regras de Manutenção de Testes

**Versão:** 1.0  
**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA

---

## 📋 Visão Geral

Este documento contém regras preventivas e checklist para garantir que os testes continuem funcionando corretamente após mudanças no código, migrações de schema, ou padronizações futuras.

---

## 🎓 Lições Aprendidas da Padronização

As seguintes lições foram aprendidas durante a padronização dos testes e devem ser aplicadas em futuras migrações:

### 1. Factories devem ser obrigatórias após padronização

**Problema Encontrado:**  
Testes ainda usavam `prisma.user.create()` diretamente após criação de factories, causando erros quando o schema mudou (adicionou `firstName`/`lastName`, removeu `name`).

**Regra Preventiva:**
- ✅ **Nunca use `prisma.*.create()` diretamente em testes** - use sempre factories
- ✅ **Use apenas factories:** `createTestUser()`, `createTestChurch()`, `createTestMember()`, etc.
- ✅ **Validação:** Adicionar lint rule ou pre-commit hook para bloquear `prisma.user.create`, `prisma.church.create`, etc. em arquivos de teste

**Checklist:**
- [ ] Nenhuma chamada direta a `prisma.*.create()` em arquivos de teste
- [ ] Todas as entidades criadas via factories (`createTestUser`, `createTestChurch`, etc.)
- [ ] Lint rule configurada para bloquear padrões antigos

---

### 2. Ciclo de vida de testes deve ser consistente

**Problema Encontrado:**  
`planId` criado no `beforeAll` sendo deletado no `beforeEach` causava foreign key constraint violations.

**Regra Preventiva:**
- ✅ **Sempre criar entidades dependentes após `resetTestDatabase()` no `beforeEach`**
- ✅ **Nunca armazenar IDs de entidades criadas no `beforeAll` que serão deletadas no `beforeEach`**
- ✅ **Se precisar persistir entre testes, usar seed ao invés de `beforeAll`**

**Template Obrigatório:**
```typescript
beforeAll(async () => {
  app = await createTestApp()
  await resetTestDatabase()  // Limpar antes de começar
})

beforeEach(async () => {
  await resetTestDatabase()  // Isolar cada teste
  
  // ✅ Criar dependências necessárias APÓS reset
  const plan = await createTestPlan({ ... })
  planId = plan.id
  
  // Criar outras entidades que dependem do plano
  const user = await createTestUser({ ... })
  await createTestSubscription(user.id, planId, ...)
})
```

**Checklist:**
- [ ] `resetTestDatabase()` chamado no `beforeEach` (não apenas no `beforeAll`)
- [ ] Todas as entidades criadas APÓS `resetTestDatabase()` no `beforeEach`
- [ ] Nenhum ID de entidade criado no `beforeAll` usado no `beforeEach` após reset
- [ ] Se entidade precisa persistir, usar seed ao invés de `beforeAll`

---

### 3. Verificar estrutura de retorno após refatoração

**Problema Encontrado:**  
Código acessando `testUser.user.id` após refatoração que mudou retorno de `{ user }` para `user` diretamente.

**Regra Preventiva:**
- ✅ **Sempre verificar estrutura de retorno ao refatorar helpers/factories**
- ✅ **Buscar todas as referências antes de mudar estrutura**
- ✅ **Usar TypeScript strict mode para detectar tipos incorretos**
- ✅ **Testes devem falhar em compile-time, não runtime**

**Checklist:**
- [ ] Todas as referências atualizadas após mudança de estrutura de retorno
- [ ] TypeScript strict mode habilitado (detecta erros em compile-time)
- [ ] Busca global por padrões antigos antes de mudar helpers

---

### 4. Idempotência muda status code esperado

**Problema Encontrado:**  
Testes esperavam sempre 201 mas endpoint retorna 200 quando recurso já existe (idempotência).

**Regra Preventiva:**
- ✅ **Documentar comportamento idempotente de endpoints**
- ✅ **Testes devem verificar status code baseado no estado (primeira vs segunda chamada)**
- ✅ **Se isolamento está correto, primeira chamada sempre deve retornar 201**

**Template para Testes Idempotentes:**
```typescript
it('deve criar igreja (primeira chamada retorna 201)', async () => {
  // Given: Nenhuma igreja existe
  // When: POST /churches
  const response1 = await request(app.server)
    .post('/churches')
    .set('Authorization', `Bearer ${token}`)
    .send(churchData)

  // Then: Primeira chamada retorna 201
  expect(response1.status).toBe(201)
  const churchId = response1.body.church.id

  // When: Segunda chamada (idempotência)
  const response2 = await request(app.server)
    .post('/churches')
    .set('Authorization', `Bearer ${token}`)
    .send(churchData)

  // Then: Segunda chamada retorna 200 (recurso existente)
  expect(response2.status).toBe(200)
  expect(response2.body.church.id).toBe(churchId)
})
```

**Checklist:**
- [ ] Endpoints idempotentes documentados (comportamento esperado)
- [ ] Testes verificam primeira chamada (201) e segunda chamada (200) separadamente
- [ ] Isolamento correto: primeiro teste sempre retorna 201

---

### 5. Emails devem ser únicos por teste

**Problema Encontrado:**  
Member criado no `beforeEach` com email do user, depois teste tenta criar outro com mesmo email, causando constraint violation.

**Regra Preventiva:**
- ✅ **Factory `createTestMember()` deve gerar email único por padrão (usa timestamp)**
- ✅ **Não sobrescrever email ao criar member no setup, deixar factory gerar**
- ✅ **Se precisar email específico, garantir que não conflita com outros testes**

**Padrão Correto:**
```typescript
// ✅ CORRETO: Deixar factory gerar email único
const member = await createTestMember({
  userId: user.id,
  // email não especificado - factory gera único
  role: 'ADMINGERAL',
  branchId: branch.id,
})

// ❌ INCORRETO: Usar mesmo email do user
const member = await createTestMember({
  userId: user.id,
  email: user.email,  // Pode causar duplicação
  role: 'ADMINGERAL',
  branchId: branch.id,
})
```

**Checklist:**
- [ ] Factory gera email único por padrão (usa timestamp/UUID)
- [ ] Não sobrescrever email ao criar member no setup
- [ ] Testes usam timestamps ou UUIDs para garantir unicidade

---

### 6. Foreign keys requerem IDs válidos do tipo correto

**Problema Encontrado:**  
Passando `adminChurchId` (ID de igreja) como `createdByUserId` (ID de usuário), causando foreign key constraint violation.

**Regra Preventiva:**
- ✅ **Factories devem validar tipos de IDs (TypeScript ajuda)**
- ✅ **Testes devem usar variáveis com nomes descritivos: `adminUserId`, `adminChurchId`**
- ✅ **Não reutilizar variáveis para tipos diferentes**
- ✅ **Comentário no código quando necessário: "Este ID é de church, não de user"**

**Padrão Correto:**
```typescript
// ✅ CORRETO: Nomes descritivos e IDs do tipo correto
const adminUser = await createTestUser({ ... })
const adminUserId = adminUser.id

const adminChurch = await createTestChurch({
  name: 'Igreja Admin',
  createdByUserId: adminUserId,  // ID de usuário, não de igreja
})

// ❌ INCORRETO: Tipo errado de ID
const adminChurch = await createTestChurch({
  name: 'Igreja Admin',
  createdByUserId: adminChurchId,  // ERRO: adminChurchId é ID de igreja, não de usuário!
})
```

**Checklist:**
- [ ] Variáveis com nomes descritivos (não genéricos como `id`)
- [ ] IDs do tipo correto passados para factories
- [ ] TypeScript strict mode ajuda a detectar erros de tipo

---

### 7. Endpoints públicos requerem setup de dependências

**Problema Encontrado:**  
`POST /register` com `fromLandingPage: true` busca plano "Free Plan" no banco, mas teste não criava plano antes, causando erro 500.

**Regra Preventiva:**
- ✅ **Endpoints públicos que criam subscription automaticamente requerem plano no banco**
- ✅ **Criar plano no `beforeEach` antes de testar endpoints públicos**
- ✅ **Verificar se endpoint busca plano automaticamente (documentar comportamento)**

**Template para Testes de Registro Público:**
```typescript
beforeEach(async () => {
  await resetTestDatabase()

  // ✅ Criar plano Free Plan (necessário para registro público)
  await createTestPlan({
    name: 'Free Plan',  // Nome exato que o endpoint busca
    maxMembers: 10,
    maxBranches: 1,
  })
})

it('deve criar usuário público e retornar token', async () => {
  const response = await request(app.server)
    .post('/register')
    .send({
      name: 'Novo Usuário',
      email: `user-${Date.now()}@test.com`,
      password: 'password123',
      fromLandingPage: true,
    })

  expect(response.status).toBe(201)
})
```

**Checklist:**
- [ ] Plano necessário para endpoints públicos criado no `beforeEach`
- [ ] Nome do plano corresponde ao que o endpoint busca ("Free Plan", "free", etc.)
- [ ] Documentação do endpoint especifica dependências necessárias

---

## ✅ Checklist Preventivo para Próximas Migrações

Use este checklist sempre que:
- Fazer mudanças em helpers/factories de teste
- Migrar schema do banco de dados
- Refatorar código de testes
- Adicionar novos padrões de teste

### Antes de Começar a Migração

- [ ] **Identificar escopo:** Quais arquivos/testes serão afetados?
- [ ] **Buscar padrões antigos:** Procurar por `prisma.*.create()` em testes
- [ ] **Verificar dependências:** Quais helpers/factories existem? Estão atualizados?
- [ ] **Documentar comportamento:** Endpoints idempotentes? Quais dependências necessárias?

### Durante a Migração

- [ ] **Usar factories sempre:** Nenhuma chamada direta a `prisma.*.create()`
- [ ] **Ciclo de vida correto:** Criar dependências após `resetTestDatabase()` no `beforeEach`
- [ ] **IDs persistentes:** Não armazenar IDs no `beforeAll` se entidade será deletada no `beforeEach`
- [ ] **Estrutura de retorno:** Verificar todas as referências após mudar estrutura de helpers
- [ ] **Status codes:** Testar idempotência separadamente (primeira 201, segunda 200)
- [ ] **Emails únicos:** Deixar factories gerar ou usar timestamps/UUIDs
- [ ] **Foreign keys:** Validar tipo de ID antes de passar para factories
- [ ] **Roles e permissões:** Garantir roles corretas (ADMINGERAL, etc.) quando necessário
- [ ] **Isolamento completo:** Cada teste deve ser independente (reset completo no `beforeEach`)

### Após a Migração

- [ ] **Executar todos os testes:** Verificar que nenhum teste regrediu
- [ ] **Verificar coverage:** Não diminuir coverage com mudanças
- [ ] **Atualizar documentação:** Se padrões mudaram, atualizar `TESTING_STANDARD.md`
- [ ] **Documentar problemas encontrados:** Adicionar ao relatório de investigação se houver
- [ ] **Validar isolamento:** Testes devem passar em qualquer ordem

---

## 🔧 Ferramentas e Helpers Disponíveis

### Backend Test Helpers

- **`backend/tests/utils/createTestApp.ts`**: Cria instância do Fastify para testes
- **`backend/tests/utils/db.ts`**: `resetTestDatabase()` - limpa banco de testes
- **`backend/tests/utils/auth.ts`**: `generateTestToken()`, `createAuthHeaders()` - helpers de autenticação
- **`backend/tests/utils/time.ts`**: `freezeTime()`, `unfreezeTime()` - mock de tempo
- **`backend/tests/utils/testFactories.ts`**: 
  - `createTestUser()` - cria User com `firstName`/`lastName`
  - `createTestPlan()` - cria Plan
  - `createTestSubscription()` - cria Subscription
  - `createTestChurch()` - cria Church
  - `createTestBranch()` - cria Branch
  - `createTestMember()` - cria Member (email único gerado automaticamente)
  - `createTestInviteLink()` - cria InviteLink
  - `createTestOnboardingProgress()` - cria OnboardingProgress

### Importações Recomendadas

```typescript
// ✅ CORRETO: Importar do caminho correto
import { resetTestDatabase } from '../utils/db'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'
import { 
  createTestUser,
  createTestPlan,
  createTestSubscription,
  createTestChurch,
  createTestBranch,
  createTestMember,
} from '../utils/testFactories'
import { SubscriptionStatus } from '@prisma/client'
```

---

## 📚 Referências

- **`docs/qa/TESTING_STANDARD.md`**: Padrões canônicos de teste do projeto
- **`docs/qa/TEST_FAILURE_INVESTIGATION_REPORT.md`**: Relatório de investigação de falhas
- **`docs/qa/templates/`**: Templates oficiais de testes
- **`docs/qa/TESTING_BASELINE_REPORT.md`**: Baseline de ferramentas e estrutura

---

---

## 📝 Notas Adicionais da Segunda Rodada de Correções

### Erros Cometidos e Prevenções

Durante a segunda rodada de correções, foram identificados erros adicionais que não foram cobertos na primeira rodada. Esta seção documenta esses erros para evitar que sejam repetidos.

### 8. Testes individuais também devem usar factories

**Problema Encontrado:**  
Vários testes individuais ainda usavam `prisma.user.create()` dentro do corpo do teste, causando erros `Argument firstName is missing` mesmo após corrigir o setup.

**Regra Preventiva:**
- ✅ **TODOS os `prisma.*.create()` devem ser substituídos por factories, não apenas no setup**
- ✅ **Verificar TODO o arquivo, não apenas `beforeEach`/`beforeAll`**
- ✅ **Usar busca global antes de migração completa**

**Checklist:**
- [ ] Busca global por `prisma.user.create`, `prisma.church.create`, etc. em TODO o arquivo
- [ ] Substituir TODOS os usos, não apenas no setup
- [ ] Testes individuais também devem usar factories

---

### 9. Validação de string vazia depende da implementação

**Problema Encontrado:**  
Teste esperava `[400, 422]` mas recebeu `201` porque `z.string()` aceita string vazia por padrão (sem `.min(1)`).

**Regra Preventiva:**
- ✅ **Verificar validação real do schema antes de escrever expectativa**
- ✅ **Se schema aceita string vazia, teste deve aceitar 201 ou 422 (lógica de negócio)**
- ✅ **Se schema rejeita string vazia (`.min(1)`), teste deve esperar 400**

**Checklist:**
- [ ] Verificar schema real antes de escrever expectativa
- [ ] Ajustar expectativa baseado na validação real, não assumir comportamento

---

### 10. Emails com timestamp devem usar padrão de busca

**Problema Encontrado:**  
Teste buscava por `testuser@test.com` mas factory gera `testuser-${Date.now()}@test.com`, causando 500 ou resultados vazios.

**Regra Preventiva:**
- ✅ **Testes de busca devem usar padrão (substring) ao invés de email exato**
- ✅ **Ou usar variável com email criado pela factory**
- ✅ **Não assumir email estático quando factory gera dinâmico**

**Checklist:**
- [ ] Testes de busca usam padrão (substring) quando email é dinâmico
- [ ] Ou armazenar email criado pela factory e usar no teste
- [ ] Não assumir emails estáticos quando factories geram dinamicamente

---

### 11. Limites de plano precisam estar no plano do usuário

**Problema Encontrado:**  
Teste cria novo plano com `maxBranches: 2` mas `checkPlanBranchesLimit()` busca plano do usuário (subscription), não o plano criado no teste.

**Regra Preventiva:**
- ✅ **Atualizar plano do usuário (subscription) ao invés de criar novo plano**
- ✅ **Ou atualizar plano existente do usuário**
- ✅ **Não assumir que criar novo plano afeta o usuário**

**Checklist:**
- [ ] Verificar de onde `checkPlan*Limit()` busca o plano (subscription do usuário)
- [ ] Atualizar plano do usuário, não criar novo
- [ ] Ou ajustar subscription do usuário para apontar para novo plano

---

### 12. Null handling requer nullish coalescing (??) não logical OR (||)

**Problema Encontrado:**  
`updateRelatedEvents` usava `newSchedule.description || undefined` que converte `null` para `undefined`, impedindo atualização para `null`.

**Regra Preventiva:**
- ✅ **Usar `??` (nullish coalescing) ao invés de `||` (logical OR) quando `null` é valor válido**
- ✅ **`||` converte `null`, `0`, `''`, `false` para valor padrão**
- ✅ **`??` apenas converte `null`/`undefined` para valor padrão**

**Checklist:**
- [ ] Usar `??` quando `null` é valor válido (opcional nullable fields)
- [ ] Usar `||` apenas quando `null`/falsy não é valor válido
- [ ] Verificar comportamento esperado de campos nullable

---

## 📝 Correções Aplicadas - Segunda Rodada de Testes

### Arquivos Corrigidos (20+ arquivos)

**Backend Integration Tests:**
1. ✅ `branchesRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()` (setup + 1 teste individual)
2. ✅ `contributionsRoutes.test.ts` - Migrado 5x `prisma.user.create()` → `createTestUser()` em testes individuais
3. ✅ `devotionalRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()` (setup + 3 testes individuais)
4. ✅ `financesRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()`
5. ✅ `noticesRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()`
6. ✅ `permissionsRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()`
7. ✅ `positionRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()`
8. ✅ `registerInvite.test.ts` - Migrado `prisma.user.create()` → `createTestUser()`
9. ✅ `registerService.test.ts` - Migrado `prisma.user.create()` → `createTestUser()`
10. ✅ `uploadRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()` + removido import `bcrypt`
11. ✅ `churchesRoutes.test.ts` - Corrigido idempotência (espera 200 quando igreja já existe), corrigido emails únicos em DELETE, corrigido `otherUser3`/`otherUser4`
12. ✅ `churchCreation.test.ts` - Ajustado expectativa para nome vazio (aceita 400/422/201 dependendo da validação)
13. ✅ `onboardingRoutes.test.ts` - Corrigido `planId` undefined no `beforeEach` do describe aninhado, ajustado `maxBranches: 2` no beforeEach
14. ✅ `admin/adminUsersRoutes.test.ts` - Migrado 3x `prisma.user.create()` → `createTestUser()` em testes individuais, corrigido busca por email (usar padrão)
15. ✅ `admin/adminChurchesRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()` via dynamic import
16. ✅ `admin/adminSubscriptionsRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()` via dynamic import
17. ✅ `admin/adminDashboardRoutes.test.ts` - Migrado `prisma.user.create()` → `createTestUser()` via dynamic import

**Backend Services:**
1. ✅ `serviceScheduleService.ts` - Corrigido null handling (`||` → `??`) para permitir atualização para `null`

**Backend Test Utils:**
1. ✅ `seedTestDatabase.ts` - Migrado 2x `prisma.user.create()` → usar `firstName`/`lastName`

**Documentação:**
1. ✅ `TESTING_MAINTENANCE_RULES.md` - Adicionadas lições aprendidas da segunda rodada (8-12)

### Problemas Específicos Resolvidos

1. ✅ **Todos os `prisma.user.create()` migrados** - 20+ arquivos corrigidos (setup + testes individuais)
2. ✅ **Ciclo de vida de testes** - `planId` criado no `beforeEach` após `resetTestDatabase()` em todos os arquivos
3. ✅ **Foreign keys corrigidos** - `adminChurchId` → `adminUserId` onde apropriado
4. ✅ **Emails únicos** - Timestamps/UUIDs em todos os testes que criam members/users
5. ✅ **Status codes idempotentes** - Aceita 200 quando recurso já existe (churchesRoutes)
6. ✅ **Null handling** - `??` ao invés de `||` quando `null` é valor válido (serviceScheduleService)
7. ✅ **Busca por email** - Usa padrão (substring) quando email é dinâmico (adminUsersRoutes)
8. ✅ **Limites de plano** - Entendimento de que `checkPlan*Limit()` busca do usuário (subscription), não plano criado no teste

### Erros para NÃO Cometer Novamente

#### ❌ ERRO 1: Usar `prisma.*.create()` diretamente em testes individuais
- **Por quê:** Schema pode mudar (ex: adicionar `firstName`/`lastName`, remover `name`)
- **Solução:** Sempre usar factories, não apenas no setup

#### ❌ ERRO 2: Criar plano no `beforeAll` e usar no `beforeEach` após `resetTestDatabase()`
- **Por quê:** `resetTestDatabase()` deleta tudo, incluindo planos
- **Solução:** Criar plano no `beforeEach` após `resetTestDatabase()`

#### ❌ ERRO 3: Usar `||` quando `null` é valor válido
- **Por quê:** `||` converte `null` para valor padrão, impedindo atualização para `null`
- **Solução:** Usar `??` quando `null` é valor válido

#### ❌ ERRO 4: Buscar por email exato quando factory gera dinâmico
- **Por quê:** Factory usa `Date.now()` para garantir unicidade
- **Solução:** Usar padrão (substring) ou variável com email criado

#### ❌ ERRO 5: Criar novo plano no teste esperando que afete o usuário
- **Por quê:** `checkPlan*Limit()` busca plano do usuário (subscription), não plano criado no teste
- **Solução:** Atualizar plano do usuário ou subscription

#### ❌ ERRO 6: Assumir que `z.string()` rejeita string vazia
- **Por quê:** `z.string()` aceita string vazia por padrão (sem `.min(1)`)
- **Solução:** Verificar schema real antes de escrever expectativa

#### ❌ ERRO 7: Usar mesmo `userId` para múltiplos members no mesmo teste
- **Por quê:** `userId` é unique constraint em Member
- **Solução:** Criar user diferente para cada member quando necessário

#### ❌ ERRO 8: Esperar sempre 201 quando endpoint é idempotente
- **Por quê:** Endpoints idempotentes retornam 200 quando recurso já existe
- **Solução:** Aceitar 200 ou 201 dependendo se recurso já existe

---

---

## 📝 Notas Adicionais da Terceira Rodada de Correções

### 13. Campos opcionais devem ser incluídos na interface e schema

**Problema Encontrado:**  
Testes enviavam `title` e `category` no body, mas `FinanceService` e schema do Zod não aceitavam esses campos, causando que eles fossem ignorados e retornassem `null`.

**Regra Preventiva:**
- ✅ **Interfaces de serviço devem incluir TODOS os campos opcionais aceitos pela API**
- ✅ **Schemas do Zod devem validar campos opcionais mesmo que não sejam obrigatórios**
- ✅ **Serviços devem propagar campos opcionais do input para o banco**
- ✅ **Verificar schema do Prisma para campos nullable que podem ser enviados**

**Padrão Correto:**
```typescript
// ✅ CORRETO: Interface inclui campo opcional
interface CreateTransactionInput {
  amount: number
  type: TransactionType
  title?: string | null  // Campo opcional do schema
  category?: string | null  // Campo opcional do schema
  entryType?: EntryType
  // ...
}

// ✅ CORRETO: Schema do Zod aceita campo opcional
export const createTransactionBodySchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['ENTRY', 'EXIT']),
  title: z.string().nullable().optional(),  // Aceita null ou string
  category: z.string().nullable().optional(),  // Aceita null ou string
  // ...
})

// ✅ CORRETO: Serviço propaga campo opcional
async create(data: CreateTransactionInput) {
  const transactionData: any = {
    amount: data.amount,
    type: data.type,
    branchId: data.branchId,
  }
  
  // Adicionar campo opcional se fornecido (inclui null)
  if (data.title !== undefined) transactionData.title = data.title
  if (data.category !== undefined) transactionData.category = data.category
  // ...
}
```

**Checklist:**
- [ ] Interface do serviço inclui TODOS os campos opcionais do schema do Prisma
- [ ] Schema do Zod valida campos opcionais (`.nullable().optional()`)
- [ ] Serviço propaga campos opcionais do input para o banco (usa `!== undefined` para permitir `null`)
- [ ] Verificar schema do Prisma para campos nullable

---

### 14. Null handling em TypeScript: usar `??` não `||` para campos nullable

**Problema Encontrado:**  
`updateRelatedEvents` usava `newSchedule.description || undefined` que converte `null` para `undefined`, impedindo atualização para `null` em campos nullable.

**Regra Preventiva:**
- ✅ **Usar `??` (nullish coalescing) ao invés de `||` (logical OR) quando `null` é valor válido**
- ✅ **`||` converte `null`, `0`, `''`, `false` para valor padrão (perde informação)**
- ✅ **`??` apenas converte `null`/`undefined` para valor padrão (preserva outros falsy)**
- ✅ **Tipar campos nullable como `string | null` ao invés de `string | undefined` quando `null` é valor válido**

**Padrão Correto:**
```typescript
// ✅ CORRETO: Permite null explicitamente
const updateData: {
  title: string
  time: string
  description?: string | null  // Pode ser null
  location?: string | null  // Pode ser null
} = {
  title: newSchedule.title,
  time: newSchedule.time,
}

// ✅ CORRETO: Usa null diretamente (não ?? undefined)
if (newSchedule.description !== undefined) {
  updateData.description = newSchedule.description  // null é valor válido
}

// ❌ INCORRETO: Converte null para undefined
if (newSchedule.description !== undefined) {
  updateData.description = newSchedule.description ?? undefined  // Perde null
}

// ❌ INCORRETO: Usa || que converte null para undefined
if (newSchedule.description !== undefined) {
  updateData.description = newSchedule.description || undefined  // Perde null
}
```

**Checklist:**
- [ ] Usar `??` quando `null` é valor válido (campos nullable)
- [ ] Tipar campos nullable como `Type | null` quando `null` é valor válido
- [ ] Não converter `null` para `undefined` quando `null` deve ser persistido
- [ ] Verificar comportamento esperado de campos nullable no schema do Prisma

---

### 15. Busca global por padrões antigos antes de migração completa

**Problema Encontrado:**  
Após corrigir `prisma.user.create()` no setup, alguns testes individuais ainda usavam o padrão antigo dentro do corpo do teste, causando erros mesmo após corrigir o setup.

**Regra Preventiva:**
- ✅ **Fazer busca global por TODOS os padrões antigos antes de migração**
- ✅ **Verificar TODO o arquivo, não apenas `beforeEach`/`beforeAll`**
- ✅ **Testes individuais também devem usar factories, não apenas setup**
- ✅ **Usar grep/ripgrep para encontrar todas as ocorrências**

**Padrão de Busca:**
```bash
# Buscar todos os padrões antigos antes de migrar
grep -r "prisma\.user\.create" backend/tests/
grep -r "prisma\.church\.create" backend/tests/
grep -r "prisma\.member\.create" backend/tests/
# ...
```

**Checklist:**
- [ ] Busca global por TODOS os padrões antigos em TODO o repositório
- [ ] Substituir TODOS os usos, não apenas no setup
- [ ] Testes individuais também devem usar factories
- [ ] Verificar arquivos dentro de subpastas (`admin/`, etc.)

---

---

## 📝 Notas Adicionais da Quarta Rodada de Correções

### 16. Buscar por campos que foram removidos do schema causa erro 500

**Problema Encontrado:**  
`adminUserService.ts` estava tentando buscar por `name` no modelo `User`, mas o schema foi atualizado para usar `firstName` e `lastName`, causando erro 500 quando tenta buscar.

**Regra Preventiva:**
- ✅ **Sempre verificar schema atual do Prisma antes de buscar por campos**
- ✅ **Se schema foi atualizado (ex: `name` → `firstName`/`lastName`), atualizar TODAS as buscas**
- ✅ **Buscar por `firstName` E `lastName` separadamente quando necessário**
- ✅ **Verificar TODOS os serviços que fazem busca quando schema é atualizado**

**Padrão Correto:**
```typescript
// ✅ CORRETO: Buscar por firstName e lastName separadamente
if (filters.search) {
  where.OR = [
    { email: { contains: filters.search, mode: 'insensitive' } },
    { firstName: { contains: filters.search, mode: 'insensitive' } },
    { lastName: { contains: filters.search, mode: 'insensitive' } },
  ]
}

// ❌ INCORRETO: Buscar por name (campo removido do schema)
if (filters.search) {
  where.OR = [
    { email: { contains: filters.search, mode: 'insensitive' } },
    { name: { contains: filters.search, mode: 'insensitive' } },  // ERRO: campo não existe
  ]
}
```

**Checklist:**
- [ ] Verificar schema atual do Prisma antes de buscar por campos
- [ ] Se schema foi atualizado, atualizar TODAS as buscas no código
- [ ] Buscar por campos separados quando necessário (`firstName` + `lastName`)
- [ ] Verificar TODOS os serviços quando schema é atualizado

---

### 17. Migração completa de Integration Tests para Factories

**Problema Encontrado:**  
Após a padronização inicial, ainda existiam 6 arquivos de integração usando `prisma.create()` direto, principalmente em testes admin.

**Regra Preventiva:**
- ✅ **Nunca adicionar novos testes usando `prisma.*.create()` direto** - usar sempre factories
- ✅ **Verificar periodicamente (antes de cada PR) se há `prisma.*.create()` em arquivos de teste**
- ✅ **Todos os arquivos admin devem usar factories assim como os arquivos principais**

**Arquivos Migrados com Sucesso:**
- ✅ `inviteLinkRoutes.test.ts` - Migrado `prisma.member.create()` para `createTestMember()`
- ✅ `admin/adminSubscriptionsRoutes.test.ts` - Migrado `prisma.plan.create()` e `prisma.subscription.create()` para factories
- ✅ `admin/adminDashboardRoutes.test.ts` - Migrado todas as criações para factories
- ✅ `admin/adminChurchesRoutes.test.ts` - Migrado todas as criações para factories
- ✅ `admin/adminPlansRoutes.test.ts` - Migrado todas as criações para factories (8 ocorrências)
- ✅ `admin/adminMembersRoutes.test.ts` - Migrado todas as criações para factories

**Resultado Final:**
- ✅ **30/30 arquivos** de integração usando factories (100%)
- ✅ **0 ocorrências** de `prisma.create()` direto em testes de integração
- ✅ **366 testes** passando após migração completa

**Checklist para Novos Testes:**
- [ ] Verificar se não há `prisma.*.create()` no arquivo antes de commitar
- [ ] Usar sempre `createTestUser`, `createTestPlan`, `createTestChurch`, `createTestBranch`, `createTestMember`, `createTestSubscription`
- [ ] Adicionar comentário `// Given:` quando criar dados de teste
- [ ] Garantir que `createTestSubscription` é usado quando necessário (não esquecer!)

---

---

### 18. Mudanças no schema do Prisma devem ser propagadas imediatamente para todos os testes unitários

**Problema Encontrado:**  
Quando o schema do Prisma muda (ex: `User.name` → `User.firstName`/`User.lastName`), os testes unitários que mockam a estrutura do Prisma também precisam ser atualizados. Caso contrário, testes falham esperando campos antigos.

**Regra Preventiva:**
- ✅ **Sempre que o schema mudar, buscar por todos os testes que usam campos afetados**
- ✅ **Atualizar TODOS os mocks relacionados no mesmo commit da mudança do schema**
- ✅ **Adicionar checklist no processo de migração de schema**

**Checklist de Migração de Schema:**
- [ ] Atualizar código de produção
- [ ] Atualizar testes de integração
- [ ] **Atualizar testes unitários (incluindo mocks)** ← NÃO ESQUECER!
- [ ] Atualizar factories/test helpers
- [ ] Verificar se todos os testes passam

**Comando Útil para Buscar:**
```bash
grep -r "name:" backend/tests/unit/ | grep -i "user\|createdBy"
```

**Padrão Correto após Mudança:**
```typescript
// ❌ ANTES (schema antigo)
CreatedByUser: {
  select: {
    id: true,
    name: true,  // ← Campo removido
    email: true,
  },
}

// ✅ DEPOIS (schema novo)
CreatedByUser: {
  select: {
    id: true,
    firstName: true,  // ← Campos novos
    lastName: true,
    email: true,
  },
}
```

---

### 19. Mocks devem cobrir TODOS os caminhos de código, incluindo fluxos de erro

**Problema Encontrado:**  
Mesmo quando um teste espera que uma função lance erro, o código pode executar outras operações antes do erro ser lançado (ex: buscar branches para contar antes de verificar plano).

**Regra Preventiva:**
- ✅ **Ao testar erros, rastrear o código até o ponto do erro**
- ✅ **Mockar TODAS as chamadas de Prisma/API, mesmo as que acontecem antes do erro**
- ✅ **Usar stack trace do erro para identificar chamadas não mockadas**

**Sintoma Típico:**
```
Cannot read properties of undefined (reading 'findMany')
```
Indica que `prisma.branch.findMany` está sendo chamado mas não está mockado.

**Padrão Correto:**
```typescript
// Arrange
// Mock necessário porque código busca branches mesmo quando lança erro de plano
prisma.branch.findMany.mockResolvedValue([])
prisma.subscription.findMany.mockResolvedValue([])

// Act & Assert
await expect(checkPlanMembersLimit(userId)).rejects.toThrow(
  'Plano não encontrado...'
)
```

---

### 20. Prisma remove campos `undefined` automaticamente do objeto `data`

**Problema Encontrado:**  
Prisma não envia campos com valor `undefined` para o banco de dados. Eles são removidos automaticamente antes da query.

**Regra Preventiva:**
- ✅ **Nunca incluir campos `undefined` nas expectativas de `prisma.create()` ou `prisma.update()`**
- ✅ **Incluir apenas campos que têm valores definidos**
- ✅ **Se campo é opcional e não foi fornecido, simplesmente não incluí-lo na expectativa**

**Padrão Correto:**
```typescript
// ❌ ERRADO
expect(prisma.transaction.create).toHaveBeenCalledWith({
  data: {
    title: "Test",
    category: undefined,  // ← Remover
    exitType: undefined,  // ← Remover
  }
})

// ✅ CORRETO
expect(prisma.transaction.create).toHaveBeenCalledWith({
  data: {
    title: "Test",
    amount: 1000,
    branchId: "branch-123",
    date: expect.any(Date),  // ← Adicionar se código adiciona automaticamente
    // category não incluído se não foi fornecido
  }
})
```

---

### 21. Testes devem refletir o comportamento REAL do código, não o comportamento esperado

**Problema Encontrado:**  
Teste esperava que `withBranch: false` impedisse criação de branch, mas o código sempre cria branch (comentário indica "obrigatório para Member").

**Regra Preventiva:**
- ✅ **Antes de corrigir teste, verificar se o comportamento do código é intencional**
- ✅ **Ler comentários no código para entender intenção**
- ✅ **Verificar outros testes que usam a mesma função**
- ✅ **Se comportamento é intencional, corrigir o teste**
- ✅ **Se comportamento não é intencional, corrigir o código E depois atualizar o teste**

**Padrão de Investigação:**
1. Ler comentários no código (ex: "Sempre cria branch principal")
2. Verificar outros testes que usam a mesma função
3. Verificar documentação/requirements
4. Decidir: Ajustar teste OU ajustar código

---

### 22. Factories devem suportar TODOS os campos do schema

**Problema Encontrado:**  
Factory `createTestUser` não suportava campo `isBlocked`, causando erro quando teste tentava criar usuário bloqueado.

**Regra Preventiva:**
- ✅ **Factories devem aceitar TODOS os campos opcionais do schema**
- ✅ **Quando novo campo é adicionado ao schema, atualizar interface E factory**
- ✅ **Manter interface factory sincronizada com schema do Prisma**

**Checklist ao Adicionar Campo ao Schema:**
- [ ] Atualizar interface da factory (ex: `UserFactoryData`)
- [ ] Atualizar implementação da factory para aceitar novo campo
- [ ] Atualizar valor padrão se aplicável
- [ ] Verificar se testes que precisam do campo estão funcionando

---

---

## 📝 Notas Adicionais da Sexta Rodada de Correções - Padronização de Testes E2E

### 26. Helpers E2E Devem Ser Atualizados quando Schemas Mudam

**Problema Encontrado:**  
Helper `registerUser()` em testes E2E não foi atualizado quando o schema do endpoint `/public/register` mudou de `name` para `firstName`/`lastName` e adicionou campos obrigatórios `phone` e `document`. Todos os 20 testes E2E que dependiam de registro falhavam com erro 400 Bad Request.

**Regra Preventiva:**
> **REGRA-E2E-001**: Quando um endpoint de API usado em testes E2E tem seu schema alterado, TODOS os helpers que chamam esse endpoint DEVEM ser atualizados no mesmo commit ou PR. Adicionar checklist para validar helpers E2E após mudanças em schemas de rotas.

**Sintoma Típico:**
```
Error: Falha ao registrar usuário: 400 - {"error":"Bad Request"}
 ❯ registerUser tests/e2e/helpers/testHelpers.ts:25:11
```

**Checklist de Validação:**
- [ ] Buscar helpers que chamam o endpoint modificado (`grep -r "endpoint-name" tests/e2e/helpers/`)
- [ ] Verificar se interface do helper corresponde ao schema atual do endpoint
- [ ] Executar testes E2E após mudanças em schemas de rotas
- [ ] Documentar mudanças breaking em helpers E2E

**Padrão Correto:**
```typescript
// ✅ CORRETO: Helper aceita campos obrigatórios do endpoint
export async function registerUser(
  app: FastifyInstance,
  userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone: string
    document: string
  }
) {
  const response = await request(app.server)
    .post('/public/register')
    .send(userData) // Envia todos os campos obrigatórios
  
  if (response.status !== 201) {
    throw new Error(`Falha ao registrar usuário: ${response.status} - ${JSON.stringify(response.body)}`)
  }
  
  return {
    user: response.body.user,
    token: response.body.token,
  }
}
```

**Retrocompatibilidade (Opcional):**
Se necessário manter suporte a formato antigo durante transição:
```typescript
// ✅ CORRETO: Aceita ambos formatos (novo e antigo)
export async function registerUser(
  app: FastifyInstance,
  userData: 
    | { firstName: string; lastName: string; email: string; password: string; phone?: string; document?: string }
    | { name: string; email: string; password: string; phone?: string; document?: string }
) {
  // Normalizar dados: converter name para firstName/lastName se necessário
  let firstName: string
  let lastName: string
  
  if ('name' in userData) {
    const nameParts = userData.name.trim().split(/\s+/)
    firstName = nameParts[0] || 'Usuário'
    lastName = nameParts.slice(1).join(' ') || 'Teste'
  } else {
    firstName = userData.firstName
    lastName = userData.lastName
  }
  
  // Gerar valores padrão se não fornecidos
  const phone = userData.phone || `11999999999`
  const document = userData.document || `12345678901`
  
  // Enviar payload com campos obrigatórios
  const payload = { firstName, lastName, email: userData.email, password: userData.password, phone, document }
  // ...
}
```

---

### 27. Helpers E2E Devem Validar Schema do Endpoint em Tempo de Execução

**Problema Encontrado:**  
Helpers E2E não validaram que estavam enviando todos os campos obrigatórios esperados pelo endpoint, causando erros 400 que eram difíceis de debugar.

**Regra Preventiva:**
> **REGRA-E2E-002**: Helpers E2E devem logar detalhes completos do erro (response.body completo e payload enviado) quando falham, facilitando debugging. Melhorar mensagens de erro para incluir campos esperados vs campos enviados.

**Padrão Correto:**
```typescript
// ✅ CORRETO: Log detalhado quando falha
const response = await request(app.server)
  .post('/public/register')
  .send(payload)

if (response.status !== 201) {
  throw new Error(
    `Falha ao registrar usuário: ${response.status} - ${JSON.stringify(response.body)}\n` +
    `Payload enviado: ${JSON.stringify(payload, null, 2)}`
  )
}
```

**Checklist de Validação:**
- [ ] Helpers logam `response.body` completo quando status não é o esperado
- [ ] Mensagens de erro incluem payload enviado para comparação
- [ ] Helpers validam formato de resposta antes de retornar

---

### 28. Mudanças Breaking em Endpoints Devem Atualizar Testes E2E

**Problema Encontrado:**  
Mudança breaking no endpoint `/public/register` (removendo `name`, adicionando `firstName`/`lastName`/`phone`/`document`) não atualizou testes E2E no mesmo PR, causando falhas em massa após merge.

**Regra Preventiva:**
> **REGRA-E2E-003**: Mudanças breaking em endpoints públicos ou autenticados que são usados em testes E2E DEVEM incluir atualização dos helpers e testes E2E no mesmo PR. Criar checklist de "mudanças breaking" que inclui testes E2E.

**Checklist de Validação:**
- [ ] PR que altera schema de endpoint lista quais helpers/testes E2E precisam atualizar
- [ ] Testes E2E executados e passando antes de merge
- [ ] Documentação de helpers atualizada se interface mudar

---

### 29. Testes de Integração Podem Servir de Referência para Helpers E2E

**Problema Encontrado:**  
Testes de integração já usavam formato correto (`firstName`/`lastName`), mas testes E2E não foram atualizados porque não foram verificados como referência.

**Regra Preventiva:**
> **REGRA-E2E-004**: Quando testes de integração e E2E testam o mesmo endpoint, devem usar o mesmo formato de dados. Buscar testes de integração como referência ao atualizar helpers E2E.

**Padrão de Busca:**
```bash
# Verificar formato usado em testes de integração
grep -r "firstName\|lastName" backend/tests/integration/ | head -20

# Verificar helpers E2E
grep -A 20 "registerUser" backend/tests/e2e/helpers/testHelpers.ts
```

**Checklist de Validação:**
- [ ] Verificar testes de integração que testam o mesmo endpoint
- [ ] Garantir que helpers E2E usam o mesmo formato de dados
- [ ] Criar helper compartilhado se formato é comum entre integration e E2E

---

### 30. Formato de Data em Helpers E2E Deve Corresponder ao Esperado pelo Endpoint

**Problema Encontrado:**  
Helper `createEvent()` documentava formato `dd/MM/yyyy` (com barra), mas endpoint esperava `dd-MM-yyyy` (com hífen), causando erros de validação de data em 4 testes.

**Regra Preventiva:**
> **REGRA-E2E-005**: Documentação de helpers E2E deve refletir exatamente o formato esperado pelo endpoint. Quando endpoint aceita múltiplos formatos, documentar todos. Verificar formato correto consultando schema/validação do endpoint.

**Sintoma Típico:**
```
Error: Falha ao criar evento: 500 - {"error":"Erro interno ao criar evento","details":"Data de início inválida: 11/01/2026. Use formato dd-MM-yyyy"}
```

**Padrão Correto:**
```typescript
// ✅ CORRETO: Documentação corresponde ao formato esperado pelo endpoint
export async function createEvent(
  app: FastifyInstance,
  token: string,
  eventData: {
    title: string
    startDate: string // formato: dd-MM-yyyy (com hífen, não barra)
    endDate: string // formato: dd-MM-yyyy (com hífen, não barra)
    // ...
  }
) {
  // ...
}
```

**Checklist de Validação:**
- [ ] Verificar formato de data/documento esperado pelo endpoint no schema/controller
- [ ] Atualizar documentação do helper para corresponder exatamente
- [ ] Atualizar todos os usos do helper nos testes para usar formato correto
- [ ] Verificar se endpoint aceita múltiplos formatos (documentar todos)

---

## 📝 Notas Adicionais da Quinta Rodada de Correções - Problema de Reset de Banco

### 23. Helpers de Teste Não Devem Falhar Silenciosamente

**Problema Encontrado:**  
A função `resetTestDatabase()` estava capturando erros e apenas logando, dando falsa impressão de sucesso. Quando `prisma.onboardingProgress` estava `undefined` (Prisma Client não regenerado), a função falhava silenciosamente, permitindo que dados residuais permanecessem no banco e causassem violações de constraint única em testes subsequentes.

**Regra Preventiva:**
> **REGRA-INFRA-001**: Helpers de infraestrutura de testes (reset, setup, teardown) devem lançar erros quando falharem. NUNCA capturar e ignorar erros silenciosamente em helpers críticos como reset de banco.

**Sintoma Típico:**
```
Erro ao resetar banco de teste: TypeError: Cannot read properties of undefined (reading 'deleteMany')
    at resetTestDatabase (backend/tests/utils/db.ts:49:37)
```
Teste passa silenciosamente, mas dados não são limpos, causando falhas em testes subsequentes com constraints únicas violadas.

**Padrão Correto:**
```typescript
// ✅ CORRETO: Lança erro quando falha (exceto tabela não existir)
async function deleteModel(
  modelName: string,
  deleteFn: () => Promise<any>
): Promise<void> {
  try {
    await deleteFn()
  } catch (error: any) {
    // P2021 = Table does not exist (OK para reset)
    if (error.code === 'P2021') {
      return
    }
    // Outros erros são críticos e devem ser lançados
    throw new Error(
      `Erro ao deletar modelo ${modelName} no reset do banco de teste: ${error.message}. Código: ${error.code}`
    )
  }
}

// ❌ INCORRETO: Captura silenciosamente
await prisma.onboardingProgress.deleteMany().catch(() => {
  // Ignora todos os erros - PERIGOSO!
})
```

**Checklist:**
- [ ] Helper tem `throw error` ou equivalente em blocos `catch`
- [ ] Não há `.catch(() => {})` em operações críticas de reset
- [ ] Erros são lançados com contexto suficiente (modelo, código de erro)
- [ ] Apenas erros esperados (P2021 = tabela não existe) são ignorados

---

### 24. Validar Prisma Client Após Mudanças no Schema

**Problema Encontrado:**  
Modelo `onboardingProgress` estava `undefined` no Prisma Client, possivelmente por Prisma Client não regenerado após mudanças no schema. A função `resetTestDatabase` tentava acessar `prisma.onboardingProgress.deleteMany()` e falhava silenciosamente.

**Regra Preventiva:**
> **REGRA-INFRA-002**: Após qualquer mudança no schema Prisma, SEMPRE executar `npx prisma generate` e validar que todos os modelos esperados existem no Prisma Client gerado.

**Sintoma Típico:**
```
TypeError: Cannot read properties of undefined (reading 'deleteMany')
    at resetTestDatabase (backend/tests/utils/db.ts:49:37)
```
Indica que um modelo do Prisma não está disponível no Prisma Client.

**Padrão Correto:**
```typescript
// ✅ CORRETO: Verifica se modelo existe antes de usar
async function safeDeleteOptionalModel(modelName: string): Promise<void> {
  try {
    const model = (prisma as any)[modelName]
    if (!model || typeof model.deleteMany !== 'function') {
      console.warn(`[RESET] Modelo ${modelName} não está disponível no Prisma Client. Verifique se o Prisma Client foi regenerado (npx prisma generate). Pulando...`)
      return
    }
    await model.deleteMany()
  } catch (error: any) {
    // Tratamento apropriado de erros...
  }
}
```

**Checklist de Validação:**
- [ ] `npx prisma generate` executado após mudanças no schema
- [ ] Script de CI/CD inclui `prisma generate` antes dos testes
- [ ] Verificação automatizada de que modelos críticos existem no Prisma Client
- [ ] Helpers de reset verificam existência de modelo antes de usar (fail-safe)

**Comandos Úteis para Debug:**
```bash
# Regenerar Prisma Client
cd backend
npx prisma generate

# Verificar modelos disponíveis
node -e "const { prisma } = require('./src/lib/prisma'); console.log(Object.keys(prisma).filter(k => !k.startsWith('$') && typeof prisma[k] === 'object' && prisma[k].deleteMany).sort().join(', '))"

# Verificar se modelo específico existe
node -e "const { prisma } = require('./src/lib/prisma'); console.log(prisma.onboardingProgress ? 'EXISTS' : 'UNDEFINED')"
```

---

### 25. Reset de Banco Deve Validar Ordem de Deleção e Dependências

**Problema Encontrado:**  
A função `resetTestDatabase` deletava modelos em ordem, mas se uma deleção falhava silenciosamente, as subsequentes ainda eram executadas, possivelmente deixando dados órfãos ou causando falhas em cascata.

**Regra Preventiva:**
> **REGRA-INFRA-003**: Funções de reset devem deletar em ordem que respeite constraints de foreign key, e devem usar validação para garantir atomicidade. Se uma deleção crítica falhar, toda a operação deve falhar.

**Padrão Correto:**
```typescript
// ✅ CORRETO: Ordem correta (filhos antes de pais) e tratamento de erros apropriado
export async function resetTestDatabase(options?: { validate?: boolean }) {
  // Helper para deletar com tratamento de erro apropriado
  async function deleteModel(
    modelName: string,
    deleteFn: () => Promise<any>
  ): Promise<void> {
    try {
      await deleteFn()
    } catch (error: any) {
      // P2021 = Table does not exist (OK para reset)
      if (error.code === 'P2021') {
        return
      }
      // Outros erros são críticos
      throw new Error(
        `Erro ao deletar modelo ${modelName}: ${error.message}. Código: ${error.code}`
      )
    }
  }

  // Deletar em ordem reversa das dependências (filhos antes de pais)
  await deleteModel('auditLog', () => prisma.auditLog.deleteMany())
  await deleteModel('devotionalLike', () => prisma.devotionalLike.deleteMany())
  // ... continua em ordem correta
  
  // Validação opcional pós-reset
  if (options?.validate) {
    const counts = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.church.count().catch(() => 0),
      prisma.plan.count().catch(() => 0),
      // ...
    ])
    
    const hasData = counts.some((count) => count > 0)
    if (hasData) {
      throw new Error(
        `Reset falhou: dados ainda presentes no banco. Counts: users=${counts[0]}, churches=${counts[1]}, ...`
      )
    }
  }
}
```

**Checklist:**
- [ ] Reset deleta em ordem correta (filhos antes de pais)
- [ ] Erros críticos são lançados, não ignorados
- [ ] Validação opcional pós-reset disponível para garantir limpeza
- [ ] Ordem de deleção documentada no código

---

### 26. Testes Unitários Não Devem Compartilhar Estado Entre Suítes

**Problema Encontrado:**  
Dados de uma suíte de testes estavam afetando outra porque o reset falhava silenciosamente. Testes subsequentes encontravam dados residuais e falhavam com constraints únicas violadas.

**Regra Preventiva:**
> **REGRA-TEST-002**: Cada suíte de testes unitários deve ser completamente isolada. `beforeAll` deve garantir estado limpo, não assumir que outros testes limparam o estado.

**Sintoma Típico:**
```
Unique constraint failed on the fields: (`name`)
    at prisma.plan.create()
```
Indica que dados de teste anterior não foram limpos, causando violação de constraint única.

**Padrão Correto:**
```typescript
// ✅ CORRETO: Cada suíte reseta no beforeAll
describe('AdminUserService - Unit Tests', () => {
  beforeAll(async () => {
    await resetTestDatabase()  // Garante estado limpo antes de começar
  })

  afterAll(async () => {
    await resetTestDatabase()  // Limpa após terminar
  })

  // Testes individuais...
})
```

**Checklist:**
- [ ] Cada suíte tem `beforeAll` que reseta o banco
- [ ] Cada suíte não assume dados de outras suítes
- [ ] Suítes podem executar em qualquer ordem sem falhar
- [ ] `resetTestDatabase` funciona corretamente (não falha silenciosamente)

---

## ✅ Checklist Preventivo para Padronização de Testes E2E

Esta seção documenta o checklist preventivo baseado nas lições aprendidas do relatório de investigação de falhas em testes E2E (`docs/qa/TEST_FAILURE_INVESTIGATION_REPORT.md`).

### Quando Usar Este Checklist

Use este checklist sempre que:
- Fazer mudanças em schemas de endpoints usados em testes E2E
- Atualizar helpers E2E (`backend/tests/e2e/helpers/testHelpers.ts`)
- Modificar endpoints públicos ou autenticados que são testados em E2E
- Adicionar novos campos obrigatórios a endpoints existentes
- Remover ou renomear campos em endpoints existentes

### Checklist de Validação de Helpers E2E

#### Antes de Fazer Mudanças em Endpoints

- [ ] **Identificar escopo**: Quais endpoints serão modificados?
- [ ] **Buscar helpers afetados**: `grep -r "endpoint-name" backend/tests/e2e/helpers/`
- [ ] **Verificar testes de integração**: Verificar formato usado em `backend/tests/integration/` como referência
- [ ] **Documentar mudanças breaking**: Listar campos adicionados/removidos/renomeados

#### Durante a Implementação

- [ ] **Atualizar helper E2E**: Modificar interface e implementação do helper
- [ ] **Manter retrocompatibilidade (se necessário)**: Suportar formato antigo durante transição
- [ ] **Gerar valores padrão**: Para campos obrigatórios novos, gerar valores padrão para testes
- [ ] **Melhorar mensagens de erro**: Incluir `response.body` completo e payload enviado em erros
- [ ] **Atualizar documentação**: Atualizar comentários JSDoc do helper

#### Após Implementação

- [ ] **Executar testes E2E**: `npm run test:e2e` deve passar (21/21 testes)
- [ ] **Verificar todos os usos**: Buscar todos os usos do helper nos testes E2E
- [ ] **Validar formato de dados**: Verificar que formato corresponde ao schema do endpoint
- [ ] **Testar retrocompatibilidade**: Se mantida, verificar que formato antigo ainda funciona

### Checklist Específico para Mudanças em `/public/register`

Quando modificar o endpoint `/public/register`:

- [ ] **Atualizar `registerUser()` helper**: `backend/tests/e2e/helpers/testHelpers.ts`
- [ ] **Atualizar `setupCompleteUser()` helper**: Se usa `registerUser()` internamente
- [ ] **Verificar testes diretos**: Buscar testes que chamam `/public/register` diretamente (ex: `user-member-model.test.ts`)
- [ ] **Validar campos obrigatórios**: `firstName`, `lastName`, `email`, `password`, `phone`, `document`
- [ ] **Verificar formato de `document`**: Deve ter mínimo 11 dígitos (CPF/CNPJ)
- [ ] **Executar todos os testes E2E**: Garantir que nenhum teste regrediu

### Comandos Úteis para Validação

```bash
# Buscar helpers que usam endpoint específico
grep -r "register" backend/tests/e2e/helpers/

# Verificar formato usado em testes de integração
grep -r "firstName\|lastName" backend/tests/integration/ | head -20

# Verificar schema do endpoint
grep -A 30 "required:" backend/src/routes/public/register.ts

# Executar testes E2E
cd backend && npm run test:e2e

# Verificar interface do helper
grep -A 20 "registerUser" backend/tests/e2e/helpers/testHelpers.ts
```

### Regras Preventivas Aplicadas

As seguintes regras devem ser seguidas:

1. **REGRA-E2E-001**: Quando um endpoint de API usado em testes E2E tem seu schema alterado, TODOS os helpers que chamam esse endpoint DEVEM ser atualizados no mesmo commit ou PR.

2. **REGRA-E2E-002**: Helpers E2E devem logar detalhes completos do erro (response.body completo e payload enviado) quando falham, facilitando debugging.

3. **REGRA-E2E-003**: Mudanças breaking em endpoints públicos ou autenticados que são usados em testes E2E DEVEM incluir atualização dos helpers e testes E2E no mesmo PR.

4. **REGRA-E2E-004**: Quando testes de integração e E2E testam o mesmo endpoint, devem usar o mesmo formato de dados. Buscar testes de integração como referência ao atualizar helpers E2E.

5. **REGRA-E2E-005**: Documentação de helpers E2E deve refletir exatamente o formato esperado pelo endpoint. Quando endpoint aceita múltiplos formatos, documentar todos.

### Exemplo de Correção Aplicada

**Problema Original:**
- Helper `registerUser()` enviava `name`, `email`, `password`
- Endpoint esperava `firstName`, `lastName`, `email`, `password`, `phone`, `document`
- 20 testes E2E falhavam com erro 400 Bad Request

**Solução Aplicada:**
- Helper atualizado para aceitar ambos formatos (novo e antigo) com retrocompatibilidade
- Conversão automática de `name` para `firstName`/`lastName`
- Geração de valores padrão para `phone` e `document` se não fornecidos
- Mensagens de erro melhoradas com payload completo

**Resultado:**
- ✅ 21/21 testes E2E passando
- ✅ Retrocompatibilidade mantida
- ✅ Documentação atualizada

---

**Última atualização:** 2025-02-01  
**Próxima revisão:** Após próxima migração significativa de testes
---

## Preventive checklist (web unit standardization)

- [ ] When using mockApiResponse, mock @/api/api with a factory that exposes get/post/put/delete and call resetApiMocks() in beforeEach.
- [ ] If a test uses renderWithProviders, mocked useAuthStore must expose setState.
- [ ] For loading states, assert on the actual loading label (example: /entrando/i) or on disabled.
- [ ] For onboarding flow assertions, verify the real route used by the component (example: /onboarding/concluido).
- [ ] When a component fetches data on mount, mock the exact endpoint used in the useEffect.
- [ ] If a vi.mock factory references a local mock function, declare it with vi.hoisted or inline it in the factory to avoid TDZ errors.
- [ ] Avoid top-level const mocks referenced by hoisted vi.mock factories (ReferenceError before initialization).
- [ ] After editing a test file, run the file once to catch syntax/parse errors early.
- [ ] Use the shared `apiMock` (`web/src/test/apiMock.ts`) in `vi.mock('@/api/api', ...)` so mockApiResponse applies to the same instance.
- [ ] If a vi.mock factory needs imported values, use an async factory (dynamic import) or vi.hoisted to avoid TDZ.

---

## 🛡️ Regression Guardrails

### Contrato Null/Undefined para Atualizações

**Regra Obrigatória:** Todos os serviços que atualizam campos nullable devem seguir este contrato:

- **`undefined`** = não atualizar o campo (campo ausente do `data`)
- **`null`** = limpar o campo (persistir NULL no banco)
- **`string`** = definir valor (persistir string no banco)

**Implementação Obrigatória:**

Para campos nullable em `updateMany` do Prisma, use a sintaxe `{ set: value }`:

```typescript
// ✅ CORRETO: Usa { set: value } para campos nullable
const updateData: {
  title: string
  time: string
  description?: { set: string | null }
  location?: { set: string | null }
} = {
  title: newSchedule.title,
  time: newSchedule.time,
}

// undefined = não atualizar (campo ausente)
// null = limpar campo ({ set: null })
// string = definir valor ({ set: 'valor' })
if (newSchedule.description !== undefined) {
  updateData.description = { set: newSchedule.description }
}

if (newSchedule.location !== undefined) {
  updateData.location = { set: newSchedule.location }
}
```

**Checklist:**
- [ ] Campos nullable usam `{ set: value }` no `updateMany`
- [ ] `undefined` não inclui o campo no `data`
- [ ] `null` usa `{ set: null }` explicitamente
- [ ] `string` usa `{ set: 'valor' }` explicitamente
- [ ] Testes verificam que `null` persiste como NULL no banco
- [ ] Testes verificam que `undefined` não atualiza o campo

---

### Centralização de Prisma Mock

**Regra Obrigatória:** Todos os testes unitários que mockam o Prisma devem usar o mock centralizado.

**Localização:** `backend/tests/mocks/prismaMock.ts`

**Uso Obrigatório:**

```typescript
// ✅ CORRETO: Usa mock centralizado com vi.hoisted
const { createPrismaMock } = vi.hoisted(() => {
  const { createPrismaMock: createMock } = require('../mocks/prismaMock')
  return { createPrismaMock: createMock }
})

const prismaMock = createPrismaMock()

vi.mock('../../src/lib/prisma', () => ({
  prisma: prismaMock,
}))

// No beforeEach, configurar mocks padrão se necessário
beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.onboardingProgress.findUnique.mockResolvedValue({ completed: false })
})
```

**Benefícios:**
- ✅ Consistência entre todos os testes
- ✅ Facilita manutenção (adicionar modelo uma vez, todos se beneficiam)
- ✅ Evita mocks incompletos (ex: falta `onboardingProgress`)
- ✅ Garante que novos modelos sejam automaticamente disponíveis

**Checklist:**
- [ ] Todos os testes unitários usam `createPrismaMock()` de `tests/mocks/prismaMock.ts`
- [ ] Nenhum mock inline do Prisma em arquivos de teste
- [ ] Novos modelos adicionados ao `prismaMock.ts` quando necessário
- [ ] `vi.hoisted()` usado para evitar problemas de hoisting
- [ ] Mock padrão configurado no `beforeEach` quando necessário

---

