# ✅ Correções Aplicadas nas Migrações

Este documento descreve as correções aplicadas nas migrações do Prisma para garantir que elas funcionem corretamente no CI, mesmo quando aplicadas fora de ordem.

## 🔧 Problema Identificado

Algumas migrações tentavam modificar tabelas (`Plan`, `Subscription`) antes de elas existirem, causando erros no CI quando aplicadas em ordem cronológica.

## 📝 Migrações Corrigidas

### 1. `20250130000000_add_payment_gateway_fields`

**Problemas corrigidos:**
- ✅ Verifica se a tabela `Plan` existe antes de adicionar colunas
- ✅ Verifica se a tabela `Subscription` existe antes de adicionar colunas
- ✅ Cria `PaymentHistory` apenas se `Subscription` existir (dependência de FK)
- ✅ Cria índices apenas se as tabelas correspondentes existirem
- ✅ Enum `SubscriptionStatus` é criado sempre (sem dependências)

**Arquivo:** `backend/prisma/migrations/20250130000000_add_payment_gateway_fields/migration.sql`

### 2. `20250625151617_add_plan_limits`

**Problemas corrigidos:**
- ✅ Verifica se a tabela `Plan` existe antes de adicionar colunas `maxBranches` e `maxMembers`
- ✅ Verifica se cada coluna já existe antes de adicioná-la (idempotência)

**Arquivo:** `backend/prisma/migrations/20250625151617_add_plan_limits/migration.sql`

### 3. `20251204130000_add_is_active_to_plan`

**Problemas corrigidos:**
- ✅ Verifica se a tabela `Plan` existe antes de adicionar coluna `isActive`
- ✅ Verifica se a coluna já existe antes de adicioná-la (idempotência)

**Arquivo:** `backend/prisma/migrations/20251204130000_add_is_active_to_plan/migration.sql`

## ✨ Características das Correções

Todas as migrações corrigidas agora:

1. **Verificam existência da tabela** antes de modificá-la
2. **Verificam existência da coluna** antes de adicioná-la (idempotência)
3. **São seguras para execução** mesmo fora de ordem cronológica
4. **Não causam erros** se as tabelas ainda não existirem

## 🧪 Como Testar

### Teste Local (Banco de Teste)

```bash
cd backend
npx dotenv-cli -e .env.test -- npx prisma migrate deploy
```

### Verificar Status das Migrações

```bash
cd backend
npx prisma migrate status
```

## 📌 Notas Importantes

- As migrações são **idempotentes** - podem ser executadas várias vezes sem problemas
- As verificações usam `information_schema` do PostgreSQL para segurança
- Todas as alterações são condicionais (`IF EXISTS`, `IF NOT EXISTS`)
- A migração `20250127000000_add_audit_log` já estava correta (já verificava existência da tabela `Church`)

## 🚀 Próximos Passos

1. ✅ Migrações corrigidas e prontas para CI
2. ⏭️ Próximo build do CI deve passar sem erros
3. 📝 Se houver problemas, verificar logs do Prisma no CI

