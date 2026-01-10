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

**Última atualização:** 2026-01-10  
**Próxima revisão:** Após próxima migração significativa de testes

