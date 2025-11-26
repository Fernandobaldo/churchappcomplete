# 📱🔄 Plano de Sincronização Mobile ↔ Backend

## 📋 Sumário Executivo

Este documento apresenta uma análise completa da sincronização entre o aplicativo mobile e o backend, identificando endpoints faltantes, inconsistências e um plano de ação detalhado para garantir total compatibilidade.

---

## 🔍 1. Análise Comparativa de Endpoints

### 1.1 Endpoints do Backend Disponíveis

#### ✅ Autenticação (`/auth`)
- `POST /auth/login` - ✅ Usado no mobile
- `POST /register` - ✅ Usado no mobile
- `GET /register/types` - ✅ Usado no mobile
- `GET /permissions/all` - ❌ **NÃO usado no mobile**
- `POST /permissions/:id` - ✅ Usado no mobile

#### ✅ Membros (`/members`)
- `GET /members` - ✅ Usado no mobile
- `GET /members/me` - ✅ Usado no mobile (mas mobile usa `/auth/me` que não existe)
- `GET /members/:id` - ✅ Usado no mobile
- `PUT /members/:id` - ✅ Usado no mobile

#### ✅ Eventos (`/events`)
- `GET /events` - ✅ Usado no mobile
- `GET /events/next` - ✅ Usado no mobile
- `GET /events/:id` - ✅ Usado no mobile
- `POST /events` - ✅ Usado no mobile
- `PUT /events/:id` - ✅ Usado no mobile

#### ✅ Contribuições (`/contributions`)
- `GET /contributions` - ✅ Usado no mobile
- `GET /contributions/types` - ✅ Usado no mobile
- `POST /contributions` - ✅ Usado no mobile
- `GET /contributions/:id` - ❌ **FALTANDO no backend** (mobile precisa para detalhes)
- `PUT /contributions/:id` - ❌ **FALTANDO no backend**
- `DELETE /contributions/:id` - ❌ **FALTANDO no backend**

#### ✅ Devocionais (`/devotionals`)
- `GET /devotionals` - ✅ Usado no mobile
- `GET /devotionals/:id` - ✅ Usado no mobile
- `POST /devotionals` - ✅ Usado no mobile
- `POST /devotionals/:id/like` - ✅ Usado no mobile
- `DELETE /devotionals/:id/unlike` - ✅ Usado no mobile
- `PUT /devotionals/:id` - ❌ **FALTANDO no backend** (mobile pode precisar para edição)
- `DELETE /devotionals/:id` - ❌ **FALTANDO no backend** (mobile pode precisar)

#### ✅ Filiais (`/branches`)
- `GET /branches` - ❌ **NÃO usado no mobile**
- `POST /branches` - ❌ **NÃO usado no mobile**
- `DELETE /branches/:id` - ❌ **NÃO usado no mobile**

#### ✅ Igrejas (`/churches`)
- `GET /churches` - ❌ **NÃO usado no mobile**
- `POST /churches` - ❌ **NÃO usado no mobile**
- `GET /churches/:id` - ❌ **NÃO usado no mobile**
- `PUT /churches/:id` - ❌ **NÃO usado no mobile**
- `DELETE /churches/:id` - ❌ **NÃO usado no mobile**
- `PATCH /churches/:id/deactivate` - ❌ **NÃO usado no mobile**

#### ✅ Planos (`/plans`)
- `GET /plans` - ❌ **NÃO usado no mobile**
- `POST /plans` - ❌ **NÃO usado no mobile** (apenas SAAS_ADMIN)

#### ✅ Assinaturas (`/subscriptions`)
- `GET /subscriptions/me` - ❌ **NÃO usado no mobile**
- `POST /subscriptions/change` - ❌ **NÃO usado no mobile**
- `GET /subscriptions` - ❌ **NÃO usado no mobile** (apenas SAAS_ADMIN)

#### ✅ Auditoria (`/audit`)
- `GET /audit` - ❌ **NÃO usado no mobile**
- `GET /audit/me` - ❌ **NÃO usado no mobile**
- `GET /audit/members/:id` - ❌ **NÃO usado no mobile**
- `GET /audit/branches/:id` - ❌ **NÃO usado no mobile**

#### ✅ Admin (`/admin`)
- `GET /admin/users` - ❌ **NÃO usado no mobile** (apenas SAAS_ADMIN)
- `GET /admin/churches` - ❌ **NÃO usado no mobile** (apenas SAAS_ADMIN)
- `GET /admin/subscriptions` - ❌ **NÃO usado no mobile** (apenas SAAS_ADMIN)
- `GET /admin/dashboard/overview` - ❌ **NÃO usado no mobile** (apenas SAAS_ADMIN)

### 1.2 Endpoints Usados no Mobile que NÃO Existem no Backend

#### ❌ **CRÍTICO: Endpoints Faltando no Backend**

1. **`GET /auth/me`** - ❌ **FALTANDO**
   - **Uso no mobile**: `DashboardScreen.tsx`, `Header.tsx`, `InviteLinkScreen.tsx`
   - **Solução**: Usar `GET /members/me` ou criar endpoint `/auth/me`
   - **Impacto**: 🔴 **ALTO** - Usado em múltiplas telas

2. **`GET /notices`** - ❌ **FALTANDO**
   - **Uso no mobile**: `NoticesScreen.tsx`
   - **Solução**: Criar módulo completo de avisos/notícias
   - **Impacto**: 🟡 **MÉDIO** - Funcionalidade não implementada

3. **`POST /notices`** - ❌ **FALTANDO**
   - **Uso no mobile**: `AddNoticeScreen.tsx`
   - **Solução**: Criar endpoint de criação de avisos
   - **Impacto**: 🟡 **MÉDIO**

4. **`POST /notices/:id/read`** - ❌ **FALTANDO**
   - **Uso no mobile**: `NoticesScreen.tsx`
   - **Solução**: Criar endpoint para marcar aviso como lido
   - **Impacto**: 🟡 **MÉDIO**

5. **`GET /finances`** - ❌ **FALTANDO**
   - **Uso no mobile**: `FinancesScreen.tsx`
   - **Solução**: Criar módulo completo de finanças
   - **Impacto**: 🟡 **MÉDIO** - Funcionalidade não implementada

6. **`POST /finances`** - ❌ **FALTANDO**
   - **Uso no mobile**: `AddTransactionScreen.tsx`
   - **Solução**: Criar endpoint de criação de transações financeiras
   - **Impacto**: 🟡 **MÉDIO**

7. **`GET /contributions/:id`** - ❌ **FALTANDO**
   - **Uso no mobile**: `ContributionDetailScreen.tsx`
   - **Solução**: Adicionar endpoint GET por ID no controller
   - **Impacto**: 🟡 **MÉDIO** - Tela de detalhes não funciona

---

## 🐛 2. Inconsistências e Problemas Identificados

### 2.1 Inconsistências de Nomenclatura

1. **Permissões**:
   - Mobile usa: `contribution_manage`
   - Backend espera: `contributions_manage` ✅ (backend está correto)
   - **Ação**: Corrigir no mobile

2. **Permissões**:
   - Mobile usa: `finance_manage`
   - Backend espera: `finances_manage` ✅ (backend está correto)
   - **Ação**: Corrigir no mobile quando implementar finanças

### 2.2 Estrutura de Dados

1. **Contribuições**:
   - Mobile espera campos: `goal`, `raised`, `bankName`, `agency`, `accountName`, `qrCodeUrl`, `paymentLink`
   - Backend não retorna esses campos
   - **Ação**: Adicionar campos no modelo e schema do backend

2. **Eventos**:
   - Mobile e backend estão sincronizados ✅

3. **Devocionais**:
   - Mobile e backend estão sincronizados ✅

4. **Membros**:
   - Mobile e backend estão sincronizados ✅

### 2.3 Problemas de Autenticação

1. **`/auth/me` vs `/members/me`**:
   - Mobile chama `/auth/me` que não existe
   - Backend tem `/members/me`
   - **Solução**: Criar `/auth/me` ou atualizar mobile para usar `/members/me`

---

## 📊 3. Matriz de Compatibilidade

| Endpoint Mobile | Endpoint Backend | Status | Prioridade |
|----------------|------------------|--------|------------|
| `GET /auth/me` | `GET /members/me` | ⚠️ Incompatível | 🔴 Alta |
| `GET /notices` | ❌ Não existe | ❌ Faltando | 🟡 Média |
| `POST /notices` | ❌ Não existe | ❌ Faltando | 🟡 Média |
| `POST /notices/:id/read` | ❌ Não existe | ❌ Faltando | 🟡 Média |
| `GET /finances` | ❌ Não existe | ❌ Faltando | 🟡 Média |
| `POST /finances` | ❌ Não existe | ❌ Faltando | 🟡 Média |
| `GET /contributions/:id` | ❌ Não existe | ❌ Faltando | 🟡 Média |
| `GET /devotionals/:id` | `GET /devotionals/:id` | ✅ OK | - |
| `POST /devotionals` | `POST /devotionals` | ✅ OK | - |
| `GET /events` | `GET /events` | ✅ OK | - |
| `GET /members` | `GET /members` | ✅ OK | - |

---

## 🎯 4. Plano de Ação Detalhado

### Fase 1: Correções Críticas (Prioridade Alta) 🔴

#### 1.1 Corrigir Endpoint de Perfil do Usuário
**Problema**: Mobile usa `/auth/me` que não existe

**Opções de Solução**:
- **Opção A** (Recomendada): Criar endpoint `/auth/me` no backend
  ```typescript
  // backend/src/routes/auth/index.ts
  app.get('/me', {
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      // Retorna dados do usuário autenticado
      return reply.send(request.user)
    }
  })
  ```

- **Opção B**: Atualizar mobile para usar `/members/me`
  ```typescript
  // mobile/src/screens/DashboardScreen.tsx
  const res = await api.get('/members/me')
  ```

**Arquivos a Modificar**:
- `backend/src/routes/auth/index.ts` (se Opção A)
- `mobile/src/screens/DashboardScreen.tsx`
- `mobile/src/components/Header.tsx`
- `mobile/src/screens/InviteLinkScreen.tsx`

**Estimativa**: 1-2 horas

---

#### 1.2 Corrigir Nomenclatura de Permissões
**Problema**: Mobile usa `contribution_manage` mas backend espera `contributions_manage`

**Arquivos a Modificar**:
- `mobile/src/screens/ContributionsScreen.tsx` (linha 54)
- Verificar outros arquivos que usam permissões

**Estimativa**: 30 minutos

---

### Fase 2: Implementar Endpoints Faltantes (Prioridade Média) 🟡

#### 2.1 Implementar Módulo de Contribuições Completo

**2.1.1 Adicionar GET por ID**
```typescript
// backend/src/routes/contributionsRoutes.ts
app.get('/:id', {
  preHandler: [authenticate],
  handler: async (request, reply) => {
    const { id } = request.params
    const contribution = await contributionService.getById(id)
    return reply.send(contribution)
  }
})
```

**2.1.2 Adicionar Campos Faltantes no Modelo**
- Adicionar campos no schema Prisma:
  - `goal` (Decimal)
  - `raised` (Decimal)
  - `bankName` (String, nullable)
  - `agency` (String, nullable)
  - `accountName` (String, nullable)
  - `qrCodeUrl` (String, nullable)
  - `paymentLink` (String, nullable)

**Arquivos a Modificar**:
- `backend/prisma/schema.prisma`
- `backend/src/routes/contributionsRoutes.ts`
- `backend/src/controllers/contributionController.ts`
- `backend/src/services/contributionService.ts`
- `backend/src/schemas/contributionSchemas.ts`

**Estimativa**: 3-4 horas

---

#### 2.2 Implementar Módulo de Avisos/Notícias

**2.2.1 Criar Modelo no Prisma**
```prisma
model Notice {
  id        String   @id @default(uuid())
  title     String
  message   String
  read      Boolean  @default(false)
  branchId  String
  branch    Branch   @relation(fields: [branchId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**2.2.2 Criar Rotas**
- `GET /notices` - Listar avisos da filial
- `POST /notices` - Criar aviso
- `POST /notices/:id/read` - Marcar como lido

**Arquivos a Criar**:
- `backend/src/routes/noticesRoutes.ts`
- `backend/src/controllers/noticeController.ts`
- `backend/src/services/noticeService.ts`
- `backend/src/schemas/noticeSchemas.ts`

**Arquivos a Modificar**:
- `backend/prisma/schema.prisma`
- `backend/src/routes/registerRoutes.ts`

**Estimativa**: 4-5 horas

---

#### 2.3 Implementar Módulo de Finanças

**2.3.1 Criar Modelo no Prisma**
```prisma
model Transaction {
  id          String   @id @default(uuid())
  title       String
  amount      Decimal
  type        String   // 'entry' ou 'exit'
  description String?
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**2.3.2 Criar Rotas**
- `GET /finances` - Listar transações com resumo (total, entradas, saídas)
- `POST /finances` - Criar transação
- `GET /finances/:id` - Obter transação por ID
- `PUT /finances/:id` - Atualizar transação
- `DELETE /finances/:id` - Deletar transação

**Arquivos a Criar**:
- `backend/src/routes/financesRoutes.ts`
- `backend/src/controllers/financeController.ts`
- `backend/src/services/financeService.ts`
- `backend/src/schemas/financeSchemas.ts`

**Arquivos a Modificar**:
- `backend/prisma/schema.prisma`
- `backend/src/routes/registerRoutes.ts`

**Estimativa**: 5-6 horas

---

#### 2.4 Adicionar Endpoints de Edição/Exclusão em Devocionais

**Rotas a Adicionar**:
- `PUT /devotionals/:id` - Editar devocional
- `DELETE /devotionals/:id` - Deletar devocional

**Arquivos a Modificar**:
- `backend/src/routes/devotionalsRoutes.ts`
- `backend/src/controllers/devotionalController.ts`
- `backend/src/services/devotionalService.ts`

**Estimativa**: 2-3 horas

---

### Fase 3: Melhorias e Otimizações (Prioridade Baixa) 🟢

#### 3.1 Adicionar Suporte a Filiais no Mobile
- Implementar telas para gerenciar filiais
- Usar endpoints existentes: `GET /branches`, `POST /branches`, `DELETE /branches/:id`

**Estimativa**: 4-5 horas

#### 3.2 Adicionar Suporte a Assinaturas no Mobile
- Mostrar plano atual do usuário
- Permitir mudança de plano (se aplicável)
- Usar endpoints: `GET /subscriptions/me`, `POST /subscriptions/change`

**Estimativa**: 3-4 horas

#### 3.3 Adicionar Logs de Auditoria no Mobile
- Mostrar histórico de ações do usuário
- Usar endpoint: `GET /audit/me`

**Estimativa**: 2-3 horas

---

## 📝 5. Checklist de Implementação

### Correções Críticas
- [ ] Criar endpoint `/auth/me` ou atualizar mobile para `/members/me`
- [ ] Corrigir nomenclatura de permissões no mobile (`contribution_manage` → `contributions_manage`)

### Endpoints Faltantes
- [ ] Implementar `GET /contributions/:id`
- [ ] Adicionar campos faltantes no modelo de Contribuições
- [ ] Implementar módulo completo de Avisos/Notícias
- [ ] Implementar módulo completo de Finanças
- [ ] Adicionar `PUT /devotionals/:id`
- [ ] Adicionar `DELETE /devotionals/:id`

### Testes
- [ ] Testar todos os endpoints no Swagger
- [ ] Testar integração mobile-backend
- [ ] Validar tratamento de erros
- [ ] Validar permissões e autorizações

### Documentação
- [ ] Atualizar documentação Swagger
- [ ] Atualizar README do mobile
- [ ] Documentar novos endpoints

---

## 🚀 6. Ordem Recomendada de Implementação

1. **Semana 1**: Correções Críticas
   - Endpoint `/auth/me`
   - Correção de permissões

2. **Semana 2**: Módulo de Contribuições
   - GET por ID
   - Campos adicionais

3. **Semana 3**: Módulo de Avisos
   - Modelo, rotas, controllers, services

4. **Semana 4**: Módulo de Finanças
   - Modelo, rotas, controllers, services

5. **Semana 5**: Melhorias em Devocionais
   - PUT e DELETE

6. **Semana 6**: Testes e Documentação
   - Testes de integração
   - Atualização de documentação

---

## 📊 7. Resumo de Impacto

### Endpoints Críticos Faltando: 1
- `/auth/me` - 🔴 Alta prioridade

### Módulos Completos Faltando: 2
- Avisos/Notícias - 🟡 Média prioridade
- Finanças - 🟡 Média prioridade

### Endpoints Parciais Faltando: 4
- `GET /contributions/:id` - 🟡 Média prioridade
- `PUT /devotionals/:id` - 🟢 Baixa prioridade
- `DELETE /devotionals/:id` - 🟢 Baixa prioridade
- Campos adicionais em Contribuições - 🟡 Média prioridade

### Inconsistências: 2
- Nomenclatura de permissões - 🔴 Alta prioridade
- Endpoint de perfil - 🔴 Alta prioridade

---

## ✅ 8. Conclusão

O mobile e o backend estão **parcialmente sincronizados**. As funcionalidades principais (eventos, devocionais, membros) estão funcionando, mas há **gaps importantes** que precisam ser corrigidos:

1. **Correções críticas** devem ser feitas imediatamente (endpoint de perfil e permissões)
2. **Módulos faltantes** (avisos e finanças) são funcionalidades importantes que precisam ser implementadas
3. **Melhorias incrementais** podem ser feitas conforme necessidade

**Estimativa Total**: 20-25 horas de desenvolvimento

---

**Última atualização**: 2025-01-26
**Versão**: 1.0

