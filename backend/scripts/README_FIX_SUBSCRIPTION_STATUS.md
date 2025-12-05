# Script de Correção: SubscriptionStatus Enum

## Descrição

Este script automatiza a correção de todos os arquivos de teste que usam strings literais (como `'active'`, `'pending'`, `'canceled'`) para o campo `status` da tabela `Subscription`, substituindo-as pelo enum `SubscriptionStatus` do Prisma.

## Problema

O campo `status` na tabela `Subscription` é um enum (`SubscriptionStatus`) no schema do Prisma. Muitos arquivos de teste ainda usam strings literais como:

```typescript
// ❌ INCORRETO
status: 'active'
status: 'pending'
{ status: 'active' }
```

Isso causa erros como:
- `Error converting field "status" of expected non-nullable type "String", found incompatible value of "active"`
- `Cannot read properties of undefined (reading 'active')`

## Solução

O script:
1. Encontra todos os arquivos de teste que usam strings para `status`
2. Substitui as strings pelo enum correto: `SubscriptionStatus.active`, etc.
3. Adiciona o import necessário: `import { SubscriptionStatus } from '@prisma/client'`

## Como usar

### 1. Executar o script

```bash
cd backend
npm run fix:subscription-status
```

Ou diretamente:

```bash
cd backend
npx tsx scripts/fix-subscription-status-enum.js
```

### 2. Revisar as alterações

O script irá:
- Mostrar quais arquivos foram corrigidos
- Indicar quantas substituições foram feitas em cada arquivo
- Adicionar imports automaticamente quando necessário

### 3. Verificar as alterações com Git

```bash
git diff
```

### 4. Testar

Após as correções, execute os testes:

```bash
npm test
```

## O que o script faz

### Substituições automáticas

- `status: 'active'` → `status: SubscriptionStatus.active`
- `status: 'pending'` → `status: SubscriptionStatus.pending`
- `status: 'canceled'` → `status: SubscriptionStatus.canceled`
- `status: 'past_due'` → `status: SubscriptionStatus.past_due`
- `status: 'unpaid'` → `status: SubscriptionStatus.unpaid`
- `status: 'trialing'` → `status: SubscriptionStatus.trialing`

### Preservação de query strings HTTP

O script é inteligente e **NÃO altera** query strings HTTP, que devem continuar como strings:

```typescript
// ✅ CORRETO - Query string HTTP (não será alterado)
.query({ status: 'active' })

// ✅ CORRETO - Operação Prisma (será alterado)
await prisma.subscription.create({
  data: { status: 'active' }  // Será alterado para SubscriptionStatus.active
})
```

### Adição automática de imports

O script detecta se o arquivo precisa do import e adiciona:

```typescript
import { SubscriptionStatus } from '@prisma/client'
```

Ou adiciona ao import existente:

```typescript
// Antes
import { Role } from '@prisma/client'

// Depois
import { SubscriptionStatus, Role } from '@prisma/client'
```

## Exemplo de correção

### Antes

```typescript
await prisma.subscription.create({
  data: {
    userId: user.id,
    planId: plan.id,
    status: 'active',
  },
})
```

### Depois

```typescript
import { SubscriptionStatus } from '@prisma/client'

await prisma.subscription.create({
  data: {
    userId: user.id,
    planId: plan.id,
    status: SubscriptionStatus.active,
  },
})
```

## Arquivos afetados

O script processa todos os arquivos em:
- `backend/tests/**/*.test.ts`
- `backend/tests/**/*.test.js`
- `backend/tests/**/*.spec.ts`
- `backend/tests/**/*.spec.js`

## Notas importantes

1. ⚠️ **Sempre revise as alterações antes de fazer commit**
2. O script é **idempotente** - pode ser executado múltiplas vezes sem causar problemas
3. O script **não altera** arquivos que já estão corretos
4. Arquivos em `backend/src/` **não são alterados** (apenas testes)

## Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

Certifique-se de que as dependências estão instaladas:

```bash
npm install
npx prisma generate
```

### O script não encontra arquivos

Verifique se você está executando o script a partir do diretório `backend/`:

```bash
cd backend
npm run fix:subscription-status
```

### Preciso reverter as alterações

Use Git para reverter:

```bash
git checkout -- tests/
```

## Status dos arquivos

- ✅ Arquivos em `backend/src/` já foram corrigidos manualmente
- ✅ `backend/tests/utils/seedTestDatabase.ts` já foi corrigido
- ⚠️ Arquivos de teste ainda precisam ser corrigidos (use este script)

