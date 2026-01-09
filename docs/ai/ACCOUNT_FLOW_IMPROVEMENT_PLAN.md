# Plano de Melhorias: Fluxo de Criação de Conta e Primeiro Acesso

**Data:** 2025-02-01 (Atualizado após refatoração completa)  
**Baseado em:** `docs/ai/ACCOUNT_CREATION_FLOW_REPORT.md` (atualizado)  
**Status:** Maioria dos itens críticos implementados

---

## 📋 Sumário Executivo

Este plano documenta melhorias propostas e seu status atual após a refatoração completa do onboarding. A maioria dos itens críticos foi implementada, incluindo sistema de rastreamento de progresso (`OnboardingProgress`), guards de navegação baseados em `onboardingCompleted`, e prevenção de duplicação de igreja.

**Total de itens:** 11 melhorias identificadas  
**Status atual:**
- ✅ **DONE:** 6 itens (0.1, 0.2, 1.1, 1.3 parcial, 2.2, sistema de progresso)
- 🔄 **PARTIAL:** 1 item (1.3 - código estável implementado, mas sem health check)
- ❌ **DISCARDED:** 2 itens (0.3, 3.1 - abordagem diferente implementada)
- ⏳ **PENDING:** 2 itens (1.2, 2.1, 1.4, 3.2)

---

## 🎯 Princípios do Plano

- **Incremental:** Mudanças pequenas e testáveis
- **Baixo Risco:** Não quebrar funcionalidades existentes
- **Backward Compatible:** Manter compatibilidade com código existente
- **Testável:** Cada mudança deve ser validável manualmente
- **Documentado:** Mudanças devem ser claras e rastreáveis
- **Token como Source of Truth:** Qualquer mudança de contexto de membership deve atualizar token imediatamente

---

## 📊 Matriz de Priorização (Atualizada)

| Item | Status | Severidade | ROI | Esforço | Risco | Fase | Notas |
|------|--------|------------|-----|---------|-------|------|-------|
| 0.1. Token atualizado após criar igreja | ✅ DONE | 🔴 ALTA | Alto | S | Baixo | 0 | Implementado em ChurchScreen |
| 0.2. Guard global de navegação | ✅ DONE | 🔴 ALTA | Alto | S | Baixo | 0 | Implementado em AppNavigator com onboardingCompleted |
| 0.3. Remover validação client-side de invite link | ❌ DISCARDED | 🟡 MÉDIA | Médio | S | Baixo | 0 | Mantida por UX (feedback rápido) |
| 1.1. Onboarding obrigatório | ✅ DONE | 🔴 ALTA | Alto | S | Baixo | 1 | Implementado via OnboardingProgress |
| 1.2. 401 interceptor com navigation ref | ⏳ PENDING | 🟡 MÉDIA | Médio | M | Baixo | 1 | Infraestrutura existe, mas não usado em 401 |
| 1.3. Validação de plano com código estável | 🔄 PARTIAL | 🔴 ALTA | Alto | M | Médio | 1 | Campo `code` implementado, health check pendente |
| 1.4. Checklist pré-deploy para planos | ⏳ PENDING | 🔴 ALTA | Alto | S | Baixo | 1 | Documentação pendente |
| 2.1. Refresh token | ⏳ PENDING | 🟡 MÉDIA | Alto | L | Alto | 2 | Não implementado |
| 2.2. Limpar AsyncStorage após onboarding | ✅ DONE | 🟢 BAIXA | Baixo | S | Baixo | 2 | Implementado em authStore.logout() |
| 3.1. Implementar SettingsOnboarding completo | ❌ DISCARDED | 🟢 BAIXA | Baixo | L | Médio | 3 | Step 3 transformado em informativo |
| 3.2. Observabilidade e logging | ⏳ PENDING | 🟢 BAIXA | Médio | M | Baixo | 3 | Não implementado |

---

## ✅ Fase 0: Quick Wins (Safe Fixes) - STATUS

### Item 0.1: Atualizar Token após Criar Igreja ✅ DONE

**Status:** ✅ **IMPLEMENTADO**

**O que foi feito:**
- `ChurchScreen.tsx` atualiza token após criar/atualizar igreja
- Token inclui `memberId`, `branchId`, `role`, `onboardingCompleted`
- Padrão aplicado consistentemente em todos os pontos de criação/atualização

**Arquivos modificados:**
- `mobile/src/screens/onboarding/ChurchScreen.tsx`
- `backend/src/controllers/churchController.ts`

**Critérios de aceitação:** ✅ Todos atendidos

---

### Item 0.2: Guard Global de Navegação ✅ DONE

**Status:** ✅ **IMPLEMENTADO** (com melhorias)

**O que foi feito:**
- `AppNavigator.tsx` implementa guard global baseado em:
  - `hasCompleteMember` (memberId, branchId, role)
  - `onboardingCompleted` (novo campo no token)
- Guard previne acesso a Main App sem Member completo E onboarding completo
- Sistema de `OnboardingProgress` rastreia progresso e marca conclusão

**Arquivos modificados:**
- `mobile/src/navigation/AppNavigator.tsx`
- `mobile/src/stores/authStore.ts` (adicionado `onboardingCompleted`)
- `backend/src/services/onboardingProgressService.ts` (novo)
- `backend/src/controllers/onboardingController.ts` (novo)

**Melhorias adicionais:**
- Sistema de rastreamento de progresso (`OnboardingProgress`)
- Endpoints para marcar etapas como completas
- Token sempre inclui `onboardingCompleted`

**Critérios de aceitação:** ✅ Todos atendidos (e mais)

---

### Item 0.3: Remover Validação Client-Side de Invite Link ❌ DISCARDED

**Status:** ❌ **DESCARTADO** (mantida por design)

**Razão:**
- Validação client-side mantida para feedback rápido ao usuário
- Backend continua sendo fonte de verdade
- UX melhor com validação imediata (não espera round-trip)

**Decisão:** Manter validação client-side para UX, backend valida de qualquer forma.

---

## ✅ Fase 1: Critical Stability/Security Fixes - STATUS

### Item 1.1: Tornar Onboarding Obrigatório ✅ DONE

**Status:** ✅ **IMPLEMENTADO** (via OnboardingProgress)

**O que foi feito:**
- Sistema `OnboardingProgress` rastreia progresso de onboarding
- Guard global verifica `onboardingCompleted` no token
- Onboarding só é marcado como completo quando usuário clica "Ir para o painel"
- Não é possível acessar Main App sem `onboardingCompleted = true`

**Arquivos modificados:**
- `backend/src/services/onboardingProgressService.ts` (novo)
- `backend/src/controllers/onboardingController.ts` (novo)
- `mobile/src/screens/onboarding/ConcluidoScreen.tsx`
- `mobile/src/navigation/AppNavigator.tsx`

**Melhorias adicionais:**
- Sistema idempotente e resumível
- Progresso rastreado por etapa (church, branches, settings)
- Token atualizado após completar onboarding

**Critérios de aceitação:** ✅ Todos atendidos (e mais)

---

### Item 1.2: 401 Interceptor com Navigation Ref ⏳ PENDING

**Status:** ⏳ **PENDENTE** (infraestrutura existe, mas não integrada)

**O que existe:**
- `mobile/src/navigation/navigationRef.ts` com `resetToLogin()`
- Função disponível para uso

**O que falta:**
- Integração no interceptor de 401 em `mobile/src/api/api.ts`
- Atualmente apenas remove token, não navega

**Esforço estimado:** M (Medium) - ~2 horas  
**Risco:** Baixo

**Critérios de aceitação:**
- [ ] Quando token expira (401), usuário é redirecionado para Login
- [ ] Stack de navegação é limpa
- [ ] Token e store são limpos antes de redirecionar

---

### Item 1.3: Validação de Plano com Código Estável 🔄 PARTIAL

**Status:** 🔄 **PARCIALMENTE IMPLEMENTADO**

**O que foi feito:**
- Campo `code` adicionado ao modelo `Plan` no Prisma
- Migration criada: `20260131000000_add_plan_code/migration.sql`
- Seed atualizado para incluir `code: 'FREE'`

**O que falta:**
- Health check endpoint (`GET /health/plans`)
- Checklist pré-deploy documentado
- Atualização de `planLimits.ts` para usar `code` (ainda usa `name`)

**Esforço estimado:** M (Medium) - 2-3 horas  
**Risco:** Médio

**Critérios de aceitação:**
- [ ] `checkPlanMembersLimit()` busca por `code: 'FREE'` ao invés de `name`
- [ ] Health check valida existência de planos (opcional)
- [ ] Checklist pré-deploy documentado

---

### Item 1.4: Checklist Pré-Deploy para Planos ⏳ PENDING

**Status:** ⏳ **PENDENTE**

**O que falta:**
- Documento `docs/DEPLOY_CHECKLIST.md` ou seção em documentação existente
- Comandos SQL para verificar planos
- Processo de deploy atualizado

**Esforço estimado:** S (Small) - ~1 hora  
**Risco:** Baixo

**Critérios de aceitação:**
- [ ] Checklist pré-deploy documenta verificação de planos
- [ ] Comandos SQL incluídos
- [ ] Processo de deploy atualizado

---

## ⏳ Fase 2: Architecture Cleanup - STATUS

### Item 2.1: Implementar Refresh Token ⏳ PENDING

**Status:** ⏳ **PENDENTE**

**Decisão:** Deferido para fase posterior. Token atual expira em 7 dias, suficiente para MVP.

**Esforço estimado:** L (Large) - 1-2 dias  
**Risco:** Alto

**Opções:**
- **Opção A:** Refresh token completo (mais seguro, mais trabalho)
- **Opção B:** Aumentar expiração para 30 dias (mais simples)

**Recomendação:** Opção B para MVP, Opção A para produção.

---

### Item 2.2: Limpar AsyncStorage Após Onboarding ✅ DONE

**Status:** ✅ **IMPLEMENTADO**

**O que foi feito:**
- `authStore.logout()` limpa todos os dados de onboarding do AsyncStorage:
  - `onboarding_church_id`
  - `onboarding_church_name`
  - `onboarding_church_address`
  - `onboarding_structure`
  - `onboarding_modules`
  - `onboarding_roles_created`

**Arquivos modificados:**
- `mobile/src/stores/authStore.ts`

**Motivo:** Prevenir vazamento de dados entre usuários (multi-tenancy security)

**Critérios de aceitação:** ✅ Todos atendidos

---

## ❌ Fase 3: UX Improvements and Observability - STATUS

### Item 3.1: Completar Implementação de SettingsOnboarding ❌ DISCARDED

**Status:** ❌ **DESCARTADO** (abordagem diferente implementada)

**O que foi feito:**
- Step 3 (Links de Convite) transformado em página informativa
- Não envia convites durante onboarding
- Usuário pode criar links depois no app principal

**Razão:**
- Onboarding focado em configuração essencial
- Links de convite não são obrigatórios para começar a usar o app
- Melhor UX: não força usuário a enviar convites imediatamente

**Decisão:** Manter como informativo, não implementar envio de convites no onboarding.

---

### Item 3.2: Adicionar Observabilidade e Logging ⏳ PENDING

**Status:** ⏳ **PENDENTE**

**O que falta:**
- Biblioteca de logging estruturado
- Logging em pontos críticos (registro, login, onboarding)
- Persistência de logs (opcional)

**Esforço estimado:** M (Medium) - 1-2 dias  
**Risco:** Baixo

**Critérios de aceitação:**
- [ ] Logs estruturados em pontos críticos
- [ ] Logs podem ser consultados para debugging
- [ ] Não há impacto de performance

---

## 🆕 Melhorias Adicionais Implementadas (Não no Plano Original)

### Sistema de Rastreamento de Progresso (OnboardingProgress)

**Status:** ✅ **IMPLEMENTADO**

**O que foi feito:**
- Modelo `OnboardingProgress` no Prisma
- Service `OnboardingProgressService` para gerenciar progresso
- Endpoints:
  - `GET /onboarding/progress` - Retorna progresso atual
  - `POST /onboarding/progress/:step` - Marca etapa como completa
  - `POST /onboarding/complete` - Marca onboarding como completo
- Token sempre inclui `onboardingCompleted`

**Benefícios:**
- Onboarding idempotente e resumível
- Progresso rastreado por etapa
- Prevenção de acesso prematuro ao app

---

### Prevenção de Duplicação de Igreja

**Status:** ✅ **IMPLEMENTADO**

**O que foi feito:**
- Campo `createdByUserId` em `Church` (FK para User)
- Backend verifica `createdByUserId` antes de criar nova igreja
- Se igreja existe, retorna existente (idempotente)
- Frontend valida ownership antes de usar dados de AsyncStorage

**Benefícios:**
- Usuário nunca pode ter mais de uma igreja "pending"
- Onboarding pode ser retomado sem criar duplicatas
- Segurança: dados isolados por tenant

---

### Validação de Ownership no Frontend

**Status:** ✅ **IMPLEMENTADO**

**O que foi feito:**
- `ChurchScreen.tsx` valida ownership antes de usar dados de AsyncStorage
- Se igreja não pertence ao usuário, limpa AsyncStorage
- Previne vazamento de dados entre tenants

**Benefícios:**
- Segurança adicional (defense in depth)
- Previne bugs de multi-tenancy

---

## 📝 Decisões de Design Finais

### 1. Onboarding Obrigatório

**Decisão:** Onboarding é obrigatório. Usuário não pode acessar Main App sem completar.

**Enforcement:**
- `AppNavigator` verifica `onboardingCompleted` no token
- `OnboardingProgress.completed` só é `true` quando usuário finaliza explicitamente

**Rationale:** Garante que usuário configura igreja antes de usar o app.

---

### 2. Token como Source of Truth

**Decisão:** Token JWT sempre inclui estado completo do usuário, incluindo `onboardingCompleted`.

**Enforcement:**
- Backend sempre inclui `onboardingCompleted` ao gerar token
- Frontend usa token para decisões de navegação

**Rationale:** Evita consultas extras ao banco, performance melhor.

---

### 3. Idempotência de Onboarding

**Decisão:** Onboarding é idempotente e resumível.

**Enforcement:**
- Backend retorna igreja existente se `createdByUserId` já existe
- Frontend preenche campos com dados existentes

**Rationale:** Melhor UX, permite retomar onboarding sem perder progresso.

---

### 4. Prevenção de Duplicação

**Decisão:** Usuário nunca pode ter mais de uma igreja "pending".

**Enforcement:**
- Backend verifica `createdByUserId` antes de criar
- Frontend valida ownership antes de usar dados

**Rationale:** Previne dados inconsistentes e problemas de multi-tenancy.

---

### 5. Seed de Planos

**Decisão:** Planos são criados via seed em dev/test, não auto-criados em produção.

**Enforcement:**
- Seed cria plano Free com `code: 'FREE'`
- Produção assume que planos existem

**Rationale:** Produção não deve criar dados base em runtime.

---

## 🧪 Estratégia de Teste/Validação (Atualizada)

### Cenários de Teste Manual

#### ✅ Implementado e Validado

**Cenário 1: Registro e Onboarding Completo**
1. Criar nova conta
2. Completar onboarding (Start → Church → Branches/Settings → Concluido)
3. Verificar que token contém `onboardingCompleted = true`
4. Verificar que acesso a Main App funciona

**Cenário 2: Guard Global de Navegação**
1. Fazer login com usuário sem Member
2. Verificar que guard redireciona para onboarding
3. Completar onboarding
4. Verificar que acesso a Main App funciona

**Cenário 3: Resumo de Onboarding**
1. Criar conta e iniciar onboarding
2. Criar igreja mas não completar
3. Fazer logout e login novamente
4. Verificar que dados são prefilled
5. Completar onboarding

**Cenário 4: Prevenção de Duplicação**
1. Criar conta e iniciar onboarding
2. Criar igreja
3. Tentar criar igreja novamente
4. Verificar que retorna igreja existente (não cria duplicata)

#### ⏳ Pendente de Teste

**Cenário 5: Token Expirado (401)**
- Requer implementação do Item 1.2

**Cenário 6: Validação de Limite de Plano**
- Requer conclusão do Item 1.3

---

## 📅 Roadmap Atualizado

### ✅ Concluído (Fase 0 e 1 parcial)

- ✅ Item 0.1: Token atualizado após criar igreja
- ✅ Item 0.2: Guard global de navegação
- ✅ Item 1.1: Onboarding obrigatório (via OnboardingProgress)
- ✅ Item 2.2: Limpeza AsyncStorage
- ✅ Sistema de rastreamento de progresso
- ✅ Prevenção de duplicação de igreja

### ⏳ Próximos Passos (Prioridade)

**Alta Prioridade:**
1. Item 1.2: 401 interceptor com navigation ref (2 horas)
2. Item 1.3: Concluir validação de plano com código estável (2-3 horas)
3. Item 1.4: Checklist pré-deploy (1 hora)

**Média Prioridade:**
4. Item 3.2: Observabilidade e logging (1-2 dias)

**Baixa Prioridade:**
5. Item 2.1: Refresh token (1-2 dias, pode ser deferido)

---

## 🎯 Métricas de Sucesso (Atualizadas)

Após implementação completa:

- ✅ **0%** de usuários presos sem Member após registro (guard global implementado)
- ✅ **100%** de usuários completam onboarding antes de acessar app (OnboardingProgress implementado)
- ⏳ **0%** de erros 401 não tratados (pendente Item 1.2)
- 🔄 **100%** de validações de limite funcionando corretamente (parcial - Item 1.3)
- ⏳ **< 5%** de usuários precisam fazer login novamente (pendente Item 2.1)

---

## 📚 Referências

- **Relatório Atualizado:** `docs/ai/ACCOUNT_CREATION_FLOW_REPORT.md`
- **Arquivos Principais:**
  - `mobile/src/navigation/AppNavigator.tsx` - Guard global
  - `mobile/src/screens/onboarding/*` - Telas de onboarding
  - `backend/src/services/onboardingProgressService.ts` - Service de progresso
  - `backend/src/controllers/onboardingController.ts` - Controller de onboarding
  - `backend/src/controllers/churchController.ts` - Prevenção de duplicação

---

**Fim do Plano de Melhorias (Atualizado)**
