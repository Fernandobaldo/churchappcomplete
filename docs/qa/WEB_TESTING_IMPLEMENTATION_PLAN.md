# Plano de Implementação - Padronização de Testes Web

**Data:** 2025-02-01  
**Versão:** 1.0  
**Status:** Em Andamento  
**Baseado em:** `docs/qa/TESTING_STANDARD.md`, `docs/qa/TESTING_MIGRATION_REPORT.md`

---

## 📋 Sumário Executivo

Este documento define o plano de implementação para padronização completa dos testes no frontend `/web`, seguindo os mesmos padrões estabelecidos no backend. A padronização será feita de forma incremental, módulo por módulo, garantindo conformidade com `TESTING_STANDARD.md`.

---

## 🎯 Objetivos

1. ✅ Padronizar todos os testes unit conforme padrão (mínimo 5 testes, padrão AAA)
2. ✅ Padronizar todos os testes integration conforme padrão (mínimo 6 testes, Given/When/Then)
3. ✅ Garantir uso correto de helpers (renderWithProviders, fixtures, mockApi)
4. ✅ Verificar e atualizar fixtures para usar firstName/lastName
5. ✅ Validar que todos os testes seguem convenções de nomenclatura
6. ✅ Garantir isolamento e determinismo dos testes

---

## 📊 Estado Atual

### Infraestrutura Disponível

✅ **Helpers existentes:**
- `web/src/test/renderWithProviders.tsx` - Render com providers
- `web/src/test/mockApi.ts` - Mock de API
- `web/src/test/fixtures/index.ts` - Fixtures reutilizáveis
- `web/src/test/setup.ts` - Setup global
- `web/src/test/mocks/` - MSW handlers e mockData

✅ **Estrutura de testes:**
- `web/src/__tests__/unit/` - Testes unitários (48 arquivos)
- `web/src/__tests__/integration/` - Testes de integração (13 arquivos)
- `web/src/__tests__/e2e/` - Testes E2E (já existem, OK)

### Problemas Identificados

⚠️ **Fixtures:**
- Fixtures usam `name` ao invés de `firstName`/`lastName` (schema atualizado)
- Falta validar se fixtures correspondem ao schema real

⚠️ **Testes Unit:**
- Precisam ser auditados contra padrão (mínimo 5 testes)
- Verificar se usam padrão AAA
- Verificar se usam renderWithProviders corretamente
- Verificar se usam fixtures

⚠️ **Testes Integration:**
- Precisam ser auditados contra padrão (mínimo 6 testes)
- Verificar se usam Given/When/Then
- Verificar se usam mockApi corretamente

---

## 📋 Fases de Implementação

### Fase 1: Atualização de Infraestrutura ✅

**Objetivo:** Garantir que helpers e fixtures estão atualizados e corretos.

#### 1.1 Verificar Fixtures

- [x] Verificar schema atual (JWT token retorna `name`, não firstName/lastName)
- [x] Confirmar que fixtures.user() usa `name` corretamente
- [x] Confirmar que fixtures.tokenPayload() usa `name` corretamente
- [x] Fixtures estão corretos - JWT token do backend retorna `name` (nome completo)

**Status:** ✅ Fixtures estão corretos. O backend combina firstName/lastName em `name` no JWT token, então o frontend está correto usando `name`.

**Nota:** Backend usa `firstName`/`lastName` no schema Prisma, mas combina em `name` no JWT token. Frontend recebe `name` do token, então fixtures estão corretos.

#### 1.2 Verificar Helpers

- [x] `renderWithProviders.tsx` - OK (já existe)
- [x] `mockApi.ts` - OK (já existe)
- [ ] Validar se helpers correspondem aos templates do padrão
- [ ] Adicionar helpers faltantes se necessário (clearAllMocks, resetApiMocks, etc.)

---

### Fase 2: Auditoria de Testes Unit ⏳

**Objetivo:** Identificar quais testes unit precisam ser padronizados.

#### 2.1 Priorização de Componentes Críticos

**Prioridade ALTA (começar por aqui):**
1. ✅ `stores/authStore.test.ts` - Store principal
2. ⏳ `components/ProtectedRoute.test.tsx` - Guard de rota
3. ⏳ `components/PermissionGuard.test.tsx` - Guard de permissão
4. ⏳ `pages/Login.test.tsx` - Página crítica
5. ⏳ `pages/Dashboard.test.tsx` - Página principal (se existir)

**Prioridade MÉDIA:**
- Outros componentes em `components/`
- Outras páginas críticas em `pages/`

**Prioridade BAIXA:**
- Páginas de formulário (AddEvent, AddMember, etc.) - podem esperar

#### 2.2 Checklist de Auditoria por Arquivo

Para cada arquivo de teste unit, verificar:

- [ ] **Quantidade:** Tem mínimo de 5 testes?
- [ ] **Padrão:** Usa AAA (Arrange-Act-Assert)?
- [ ] **Helpers:** Usa renderWithProviders (se componente)?
- [ ] **Fixtures:** Usa fixtures ao invés de dados hardcoded?
- [ ] **Mocks:** Usa mockApi ao invés de mocks manuais?
- [ ] **Nomenclatura:** Testes seguem padrão "deve [comportamento]"?
- [ ] **Cobertura:** Testa render, loading, error, empty, primary interaction?

**Template de auditoria:**
```markdown
### [ComponentName] - `unit/[path]/[ComponentName].test.tsx`

| Item | Status | Notas |
|------|--------|-------|
| Quantidade (min 5) | ⚠️/✅ | X testes atuais |
| Padrão AAA | ⚠️/✅ | Falta em Y testes |
| renderWithProviders | ⚠️/✅ | Usa setup manual |
| Fixtures | ⚠️/✅ | Dados hardcoded |
| mockApi | ⚠️/✅ | Mocks manuais |
| Nomenclatura | ⚠️/✅ | Mix de "should" e "deve" |
| Cobertura | ⚠️/✅ | Falta: loading/error/empty |

**Ações necessárias:**
- [ ] Adicionar N testes (atingir mínimo 5)
- [ ] Converter para padrão AAA
- [ ] Migrar para renderWithProviders
- [ ] Migrar para fixtures
- [ ] Migrar para mockApi
- [ ] Padronizar nomenclatura
- [ ] Adicionar testes faltantes (loading/error/empty)
```

---

### Fase 3: Auditoria de Testes Integration ⏳

**Objetivo:** Identificar quais testes integration precisam ser padronizados.

#### 3.1 Priorização de Fluxos Críticos

**Prioridade ALTA:**
1. ⏳ `integration/auth/login.test.tsx` - Fluxo crítico
2. ⏳ `integration/navigation/protected-routes.test.tsx` - Guards críticos
3. ⏳ `integration/onboarding/onboarding-flow.test.tsx` - Fluxo crítico

**Prioridade MÉDIA:**
- Outros fluxos em `integration/`

#### 3.2 Checklist de Auditoria por Arquivo

Para cada arquivo de teste integration, verificar:

- [ ] **Quantidade:** Tem mínimo de 6 testes?
- [ ] **Padrão:** Usa Given/When/Then (comentários)?
- [ ] **Helpers:** Usa renderWithProviders?
- [ ] **Mocks:** Usa mockApi corretamente?
- [ ] **Fixtures:** Usa fixtures?
- [ ] **Nomenclatura:** Testes seguem padrão "deve [comportamento]"?
- [ ] **Cobertura:** Testa route guard, prefill, submit updates, error feedback, retry, invalid action blocked?

**Template de auditoria:**
```markdown
### [FlowName] - `integration/[path]/[FlowName].test.tsx`

| Item | Status | Notas |
|------|--------|-------|
| Quantidade (min 6) | ⚠️/✅ | X testes atuais |
| Given/When/Then | ⚠️/✅ | Falta comentários |
| renderWithProviders | ⚠️/✅ | Usa setup manual |
| mockApi | ⚠️/✅ | Mocks manuais |
| Fixtures | ⚠️/✅ | Dados hardcoded |
| Nomenclatura | ⚠️/✅ | Mix de padrões |
| Cobertura | ⚠️/✅ | Falta: route guard/prefill/etc |

**Ações necessárias:**
- [ ] Adicionar N testes (atingir mínimo 6)
- [ ] Adicionar comentários Given/When/Then
- [ ] Migrar para renderWithProviders
- [ ] Migrar para mockApi
- [ ] Migrar para fixtures
- [ ] Padronizar nomenclatura
- [ ] Adicionar testes faltantes
```

---

### Fase 4: Padronização Incremental ⏳

**Objetivo:** Padronizar testes módulo por módulo, começando pelos críticos.

#### 4.1 Ordem de Padronização (Unit Tests)

1. **stores/authStore.test.ts** (ALTA prioridade)
   - Verificar quantidade de testes
   - Padronizar para usar fixtures
   - Garantir padrão AAA
   - Adicionar testes faltantes se necessário

2. **components/ProtectedRoute.test.tsx**
   - Verificar quantidade de testes
   - Migrar para renderWithProviders
   - Usar fixtures
   - Garantir padrão AAA
   - Adicionar testes faltantes

3. **components/PermissionGuard.test.tsx**
   - (mesmo processo)

4. **pages/Login.test.tsx**
   - (mesmo processo)

5. **Outros componentes/páginas** (conforme prioridade)

#### 4.2 Ordem de Padronização (Integration Tests)

1. **integration/auth/login.test.tsx**
   - Verificar quantidade de testes
   - Adicionar comentários Given/When/Then
   - Migrar para mockApi se necessário
   - Usar fixtures
   - Adicionar testes faltantes

2. **integration/navigation/protected-routes.test.tsx**
   - (mesmo processo)

3. **integration/onboarding/onboarding-flow.test.tsx**
   - (mesmo processo)

4. **Outros fluxos** (conforme prioridade)

---

## 📝 Checklist de Conformidade

### Unit Tests - Checklist Obrigatório

Antes de considerar um teste unit completo:

- [ ] **Estrutura:**
  - [ ] Arquivo está em `__tests__/unit/`
  - [ ] Nome segue padrão: `[Component/Page/Store][Name].test.{ts,tsx}`
  - [ ] Imports corretos (renderWithProviders, fixtures, mockApi)

- [ ] **Conteúdo:**
  - [ ] Mínimo 5 testes implementados
  - [ ] Padrão AAA (Arrange-Act-Assert) em todos os testes
  - [ ] Usa renderWithProviders (se componente)
  - [ ] Usa fixtures (não dados hardcoded)
  - [ ] Usa mockApi (não mocks manuais)
  - [ ] Testes são determinísticos

- [ ] **Cobertura:**
  - [ ] Teste 1: Basic render
  - [ ] Teste 2: Loading state
  - [ ] Teste 3: Error state + retry
  - [ ] Teste 4: Empty state
  - [ ] Teste 5: Primary interaction

- [ ] **Nomenclatura:**
  - [ ] Nomes seguem padrão: "deve [comportamento esperado]"
  - [ ] Não usa "should", usa "deve"

### Integration Tests - Checklist Obrigatório

Antes de considerar um teste integration completo:

- [ ] **Estrutura:**
  - [ ] Arquivo está em `__tests__/integration/`
  - [ ] Nome segue padrão: `[feature]/[flow].test.{ts,tsx}`
  - [ ] Imports corretos (renderWithProviders, fixtures, mockApi)

- [ ] **Conteúdo:**
  - [ ] Mínimo 6 testes implementados
  - [ ] Padrão Given/When/Then (comentários) em todos os testes
  - [ ] Usa renderWithProviders
  - [ ] Usa mockApi (não mocks manuais)
  - [ ] Usa fixtures (não dados hardcoded)
  - [ ] Testes são determinísticos

- [ ] **Cobertura:**
  - [ ] Teste 1: Route guard baseado em estado
  - [ ] Teste 2: Prefill quando aplicável
  - [ ] Teste 3: Submit updates token/store
  - [ ] Teste 4: Backend error shows feedback
  - [ ] Teste 5: Retry/refresh works
  - [ ] Teste 6: Invalid action is blocked

- [ ] **Nomenclatura:**
  - [ ] Nomes seguem padrão: "deve [comportamento esperado]"
  - [ ] Não usa "should", usa "deve"

---

## 🔍 Referências

### Documentos Base

- `docs/qa/TESTING_STANDARD.md` - Padrão canônico obrigatório
- `docs/qa/TESTING_MIGRATION_REPORT.md` - Relatório de migração do backend
- `docs/qa/TESTING_BASELINE_REPORT.md` - Baseline de infraestrutura
- `docs/qa/TESTING_MAINTENANCE_RULES.md` - Regras de manutenção

### Templates

- `docs/qa/templates/unit.ui.spec.tsx` - Template de unit test UI
- `docs/qa/templates/integration.ui.spec.tsx` - Template de integration test UI

### Helpers e Fixtures

- `web/src/test/renderWithProviders.tsx` - Helper de render
- `web/src/test/mockApi.ts` - Helper de mock de API
- `web/src/test/fixtures/index.ts` - Fixtures reutilizáveis

---

## 📊 Progresso

### Fase 1: Infraestrutura

- [ ] 1.1 Atualizar fixtures (firstName/lastName)
- [ ] 1.2 Verificar helpers

### Fase 2: Auditoria Unit

- [ ] 2.1 Auditoria stores/authStore.test.ts
- [ ] 2.2 Auditoria components/ProtectedRoute.test.tsx
- [ ] 2.3 Auditoria components/PermissionGuard.test.tsx
- [ ] 2.4 Auditoria pages/Login.test.tsx
- [ ] 2.5 Auditoria outros componentes (conforme prioridade)

### Fase 3: Auditoria Integration

- [ ] 3.1 Auditoria integration/auth/login.test.tsx
- [ ] 3.2 Auditoria integration/navigation/protected-routes.test.tsx
- [ ] 3.3 Auditoria integration/onboarding/onboarding-flow.test.tsx
- [ ] 3.4 Auditoria outros fluxos (conforme prioridade)

### Fase 4: Padronização

- [ ] 4.1 Padronizar stores/authStore.test.ts
- [ ] 4.2 Padronizar components/ProtectedRoute.test.tsx
- [ ] 4.3 Padronizar components/PermissionGuard.test.tsx
- [ ] 4.4 Padronizar pages/Login.test.tsx
- [ ] 4.5 Padronizar integration/auth/login.test.tsx
- [ ] 4.6 Padronizar integration/navigation/protected-routes.test.tsx
- [ ] 4.7 Padronizar integration/onboarding/onboarding-flow.test.tsx
- [ ] 4.8 Padronizar outros módulos (conforme prioridade)

---

## ✅ Critérios de Conclusão

A padronização será considerada concluída quando:

1. ✅ Todos os fixtures estão atualizados (firstName/lastName)
2. ✅ Todos os testes unit críticos seguem o padrão (mínimo 5 testes, AAA)
3. ✅ Todos os testes integration críticos seguem o padrão (mínimo 6 testes, Given/When/Then)
4. ✅ Todos os testes usam helpers corretamente (renderWithProviders, fixtures, mockApi)
5. ✅ Todos os testes seguem nomenclatura padrão ("deve [comportamento]")
6. ✅ Todos os testes passam após padronização
7. ✅ Documentação atualizada (este plano marcado como concluído)

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA  
**Versão:** 1.0  
**Status:** Em Andamento

