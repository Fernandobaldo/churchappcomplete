# Relatório de Investigação de Falhas em Testes de Segurança

**Data:** 2025-02-01  
**Versão:** 1.0  
**Tipo:** Investigação de Falhas (sem correções)  
**Escopo:** Testes de Segurança Multi-Tenant

---

## 📋 Sumário Executivo

Todos os 7 arquivos de teste de segurança estão falhando com o mesmo erro relacionado à criação de `Subscription` no factory `createTenantSetup`. O erro é causado por uma **assunção incorreta sobre o schema do Prisma** - tentativa de usar `upsert` com um campo que não é único.

**Status:** ✅ **Causa Raiz Identificada** - Erro de Standardization (assunção incorreta sobre schema)

---

## 🔍 Tabela de Falhas

| Test File | Test Name | Failure Symptom | Root Cause | Classification | Confidence |
|-----------|-----------|-----------------|------------|----------------|------------|
| `security.churches.test.ts` | Security: Churches Module (beforeAll) | `PrismaClientValidationError: Invalid prisma.subscription.upsert()` | `userId` não é campo único em Subscription | **STANDARDIZATION** | **High** |
| `security.branches.test.ts` | Security: Branches Module (beforeAll) | `PrismaClientValidationError: Invalid prisma.subscription.upsert()` | `userId` não é campo único em Subscription | **STANDARDIZATION** | **High** |
| `security.members.test.ts` | Security: Members Module (beforeAll) | `PrismaClientValidationError: Invalid prisma.subscription.upsert()` | `userId` não é campo único em Subscription | **STANDARDIZATION** | **High** |
| `security.permissions.test.ts` | Security: Permissions Module (beforeAll) | `PrismaClientValidationError: Invalid prisma.subscription.upsert()` | `userId` não é campo único em Subscription | **STANDARDIZATION** | **High** |
| `security.resources.test.ts` | Security: Resource Modules (beforeAll) | `PrismaClientValidationError: Invalid prisma.subscription.upsert()` | `userId` não é campo único em Subscription | **STANDARDIZATION** | **High** |
| `security.inviteLinks.test.ts` | Security: Invite Links Module (beforeAll) | `PrismaClientValidationError: Invalid prisma.subscription.upsert()` | `userId` não é campo único em Subscription | **STANDARDIZATION** | **High** |
| `security.onboarding.test.ts` | Security: Onboarding Module (beforeAll) | `PrismaClientValidationError: Invalid prisma.subscription.upsert()` | `userId` não é campo único em Subscription | **STANDARDIZATION** | **High** |

**Total de Falhas:** 7 arquivos de teste (todos falhando no `beforeAll` devido ao mesmo problema)

---

## 🔬 Análise Detalhada

### Erro Principal

```
Invalid `prisma.subscription.upsert()` invocation in
C:\Users\fernando.baldo\Documents\codes\churchappcomplete\backend\tests\security\helpers\factories.ts:73:29

Argument `where` of type SubscriptionWhereUniqueInput needs at least one of `id` arguments. 
Available options are marked with ?.
```

### Localização do Problema

**Arquivo:** `backend/tests/security/helpers/factories.ts`  
**Linha:** 73  
**Função:** `createTenantSetup()`

**Código Problemático:**
```typescript
// Create Subscription
await prisma.subscription.upsert({
  where: { userId: user.id },  // ❌ ERRO: userId não é campo único
  create: {
    userId: user.id,
    planId: plan.id,
    status: 'ACTIVE',
  },
  update: {},
})
```

### Causa Raiz

1. **Schema do Prisma:**
   ```prisma
   model Subscription {
     id                    String             @id @default(cuid())
     userId                String
     planId                String
     // ...
     @@index([userId])  // ← userId tem índice, mas NÃO é único
   }
   ```

2. **Problema:**
   - `Subscription` tem apenas `id` como campo único (`@id`)
   - `userId` tem um `@@index([userId])`, mas **não é um campo único**
   - `upsert()` requer um campo único no `where`
   - Tentativa de usar `where: { userId }` falha porque `userId` não está em `SubscriptionWhereUniqueInput`

3. **Evidência do Código Existente:**
   - `backend/tests/utils/testFactories.ts` (linha 113-121): Usa `create()` diretamente, não `upsert()`
   - `backend/src/services/public/publicRegisterService.ts` (linha 55-60): Usa nested create: `Subscription: { create: { ... } }`
   - `backend/src/services/subscriptionService.ts` (linha 4-8): Usa `findFirst()` com `where: { userId }`, não `findUnique()`

### Por Que Isso Aconteceu?

**Assunção Incorreta:**
- Assumimos que `userId` seria único em `Subscription` (um usuário = uma subscription)
- Na verdade, o schema permite múltiplas subscriptions por usuário (histórico, mudanças de plano, etc.)
- O padrão correto é usar `findFirst` + `create` ou apenas `create` com tratamento de erro

---

## 📊 Classificação

### STANDARDIZATION

**Confiança:** **High**

**Justificativa:**
- O erro está em código novo (factory de testes de segurança)
- O padrão correto já existe no projeto (`createTestSubscription` em `testFactories.ts`)
- Não há bug no código de produção
- É uma assunção incorreta sobre o schema do Prisma

**Helper/Mock/Factory Responsável:**
- `backend/tests/security/helpers/factories.ts` → `createTenantSetup()` → linha 73

**Como a Assunção de Standardization Está Incorreta:**
- Assumimos que poderíamos usar `upsert` com `userId` para garantir idempotência
- O schema do Prisma não suporta isso porque `userId` não é único
- O padrão correto no projeto é usar `create()` diretamente ou verificar existência com `findFirst()` antes

---

## 🔧 Recomendações (Sem Implementação)

### Correção Recomendada

**Opção 1: Usar `create()` diretamente (mais simples)**
```typescript
// Create Subscription
await prisma.subscription.create({
  data: {
    userId: user.id,
    planId: plan.id,
    status: 'ACTIVE',
  },
})
```

**Opção 2: Verificar existência antes de criar (mais seguro)**
```typescript
// Create Subscription (if not exists)
const existingSubscription = await prisma.subscription.findFirst({
  where: { userId: user.id, status: 'ACTIVE' },
})

if (!existingSubscription) {
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: 'ACTIVE',
    },
  })
}
```

**Opção 3: Usar nested create (alinhado com padrão do projeto)**
```typescript
// Criar User com Subscription aninhada
const user = await prisma.user.create({
  data: {
    // ... campos do user
    Subscription: {
      create: {
        planId: plan.id,
        status: 'ACTIVE',
      },
    },
  },
})
```

**Recomendação:** Usar **Opção 1** ou **Opção 2** dependendo se queremos garantir idempotência. A **Opção 3** requer refatorar para criar User e Subscription juntos.

### Impacto

- **Alto:** Todos os testes de segurança estão bloqueados
- **Baixo Risco:** Correção simples, não afeta código de produção
- **Sem Breaking Changes:** Apenas ajuste no factory de testes

---

## 📚 Aprendizados e Regras Preventivas

### Lições Aprendidas

#### Lição 1: Sempre Verificar Schema do Prisma Antes de Usar `upsert()`

**Problema:**
- Assumimos que `userId` seria único em `Subscription` sem verificar o schema
- Tentamos usar `upsert()` com um campo que não é único

**Prevenção:**
- ✅ **Regra:** Antes de usar `upsert()`, verificar no schema do Prisma quais campos são únicos (`@id`, `@unique`)
- ✅ **Checklist:** 
  - Verificar `model Subscription` no `schema.prisma`
  - Confirmar que o campo usado em `where` está marcado com `@id` ou `@unique`
  - Se não for único, usar `findFirst()` + `create()` ou apenas `create()`

**Exemplo de Verificação:**
```typescript
// ❌ ERRADO (assumindo userId é único)
await prisma.subscription.upsert({
  where: { userId: user.id },  // userId não é único!
  // ...
})

// ✅ CORRETO (verificando schema primeiro)
// Schema mostra: apenas `id` é único
// Então usar:
await prisma.subscription.create({
  data: { userId: user.id, planId: plan.id, status: 'ACTIVE' },
})
```

---

#### Lição 2: Seguir Padrões Existentes no Projeto

**Problema:**
- Criamos um novo padrão (`upsert` com `userId`) sem verificar como o projeto já faz isso
- O projeto já tem `createTestSubscription` que usa `create()` diretamente

**Prevenção:**
- ✅ **Regra:** Antes de criar novos helpers/factories, verificar helpers existentes no projeto
- ✅ **Checklist:**
  - Procurar por factories/helpers similares em `backend/tests/utils/`
  - Verificar como o código de produção cria o mesmo recurso
  - Reutilizar padrões existentes quando possível

**Exemplo:**
```typescript
// ✅ CORRETO: Verificar padrão existente primeiro
// backend/tests/utils/testFactories.ts já tem:
export async function createTestSubscription(userId: string, planId: string, status: SubscriptionStatus) {
  return await prisma.subscription.create({  // ← Usa create(), não upsert()
    data: { userId, planId, status },
  })
}

// Então nosso factory deve seguir o mesmo padrão
```

---

#### Lição 3: Entender Relacionamentos 1:1 vs 1:N no Schema

**Problema:**
- Assumimos que User → Subscription seria 1:1 (um usuário = uma subscription)
- Na verdade, o schema permite 1:N (um usuário pode ter múltiplas subscriptions)

**Prevenção:**
- ✅ **Regra:** Verificar cardinalidade de relacionamentos no schema antes de assumir unicidade
- ✅ **Checklist:**
  - Verificar se há `@unique` no campo de relacionamento
  - Verificar se há múltiplas subscriptions por usuário no código de produção
  - Se for 1:N, não usar `upsert` com campo de relacionamento

**Exemplo:**
```prisma
// Schema mostra:
model Subscription {
  userId String  // ← Sem @unique, então 1:N (um user pode ter múltiplas subscriptions)
  // ...
}

// Código de produção confirma:
// - changePlan() cria nova subscription e cancela antigas
// - getMySubscription() usa findFirst() (não findUnique())
// → Confirma que é 1:N, não 1:1
```

---

#### Lição 4: Testar Factories em Isolamento Antes de Usar em Suítes

**Problema:**
- O erro só apareceu quando executamos toda a suíte de testes
- Se tivéssemos testado o factory isoladamente, teríamos detectado o erro mais cedo

**Prevenção:**
- ✅ **Regra:** Criar testes unitários para factories antes de usá-los em testes de integração
- ✅ **Checklist:**
  - Criar arquivo `tests/unit/factories.test.ts` ou similar
  - Testar cada factory isoladamente
  - Verificar criação, atualização, e casos de erro

**Exemplo:**
```typescript
// tests/unit/factories.test.ts
describe('createTenantSetup', () => {
  it('should create user with subscription', async () => {
    const setup = await createTenantSetup()
    expect(setup.user).toBeDefined()
    expect(setup.plan).toBeDefined()
    // Verificar subscription foi criada
    const subscription = await prisma.subscription.findFirst({
      where: { userId: setup.user.id },
    })
    expect(subscription).toBeDefined()
  })
})
```

---

## 📝 Checklist de Validação para Futuras Migrações

### Antes de Criar Novos Factories/Helpers

- [ ] Verificar schema do Prisma para campos únicos (`@id`, `@unique`)
- [ ] Verificar helpers/factories existentes no projeto
- [ ] Verificar como o código de produção cria o mesmo recurso
- [ ] Entender cardinalidade de relacionamentos (1:1 vs 1:N)
- [ ] Testar factory isoladamente antes de usar em suítes
- [ ] Usar `create()` quando não há necessidade de idempotência
- [ ] Usar `findFirst()` + `create()` quando precisar de idempotência sem campo único
- [ ] Usar `upsert()` apenas quando houver campo único no `where`

### Ao Usar `upsert()` no Prisma

- [ ] Confirmar que o campo em `where` está marcado com `@id` ou `@unique` no schema
- [ ] Verificar `ModelNameWhereUniqueInput` no Prisma Client para campos disponíveis
- [ ] Se não houver campo único adequado, usar `findFirst()` + `create()` ou `create()` diretamente

---

## 🎯 Resumo

### Causa Raiz
Tentativa de usar `upsert()` com `userId` em `Subscription`, mas `userId` não é um campo único no schema do Prisma.

### Classificação
**STANDARDIZATION** - Assunção incorreta sobre schema do Prisma

### Confiança
**High** - Erro claro e bem definido, padrão correto já existe no projeto

### Correção Necessária
Substituir `upsert()` por `create()` ou `findFirst()` + `create()` no factory `createTenantSetup()`.

### Impacto
- **Alto:** Todos os testes de segurança bloqueados
- **Baixo Risco:** Correção simples, sem impacto em produção

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA  
**Versão:** 1.0
