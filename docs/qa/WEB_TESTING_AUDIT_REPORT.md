# Relatório de Auditoria - Testes Web

**Data:** 2025-02-01  
**Versão:** 1.0  
**Status:** Em Progresso  
**Baseado em:** `docs/qa/TESTING_STANDARD.md`

---

## 📋 Sumário Executivo

Este documento contém a auditoria detalhada dos testes existentes no `/web`, verificando conformidade com o padrão estabelecido em `TESTING_STANDARD.md`. A auditoria é feita arquivo por arquivo, identificando o que precisa ser padronizado.

---

## 🎯 Critérios de Auditoria

### Unit Tests
- ✅ Mínimo 5 testes por componente crítico
- ✅ Padrão AAA (Arrange-Act-Assert)
- ✅ Usa renderWithProviders (se componente)
- ✅ Usa fixtures (não dados hardcoded)
- ✅ Nomenclatura: "deve [comportamento]"
- ✅ Cobertura: render, loading, error, empty, primary interaction

### Integration Tests
- ✅ Mínimo 6 testes por fluxo crítico
- ✅ Padrão Given/When/Then (comentários)
- ✅ Usa renderWithProviders
- ✅ Usa mockApi (não mocks manuais)
- ✅ Usa fixtures
- ✅ Nomenclatura: "deve [comportamento]"
- ✅ Cobertura: route guard, prefill, submit updates, error feedback, retry, invalid action blocked

---

## 📊 Auditoria de Testes Unit

### 1. stores/authStore.test.ts

**Localização:** `web/src/__tests__/unit/stores/authStore.test.ts`

#### Estado Atual

**Quantidade de testes:** 5 testes
- ✅ Atende mínimo (5 testes)

**Estrutura dos testes:**
```typescript
describe('AuthStore', () => {
  describe('setUserFromToken', () => {
    it('deve decodificar o token e definir o usuário corretamente', () => { ... })
    it('deve mapear permissões corretamente', () => { ... })
    it('deve lidar com array vazio de permissões', () => { ... })
  })
  describe('logout', () => {
    it('deve limpar usuário e token', () => { ... })
  })
  describe('setToken', () => {
    it('deve definir apenas o token', () => { ... })
  })
})
```

#### Conformidade com Padrão

| Item | Status | Detalhes |
|------|--------|----------|
| Quantidade (min 5) | ✅ | 5 testes (exatamente o mínimo) |
| Padrão AAA | ⚠️ Parcial | Alguns testes não seguem AAA explicitamente (falta comentários Arrange/Act/Assert) |
| Fixtures | ⚠️ | Usa mockDecodedToken, mas cria dados hardcoded em alguns testes (ex: logout) |
| Nomenclatura | ✅ | Todos seguem padrão "deve [comportamento]" |
| Cobertura | ⚠️ | Cobre setUserFromToken, logout, setToken. Falta: updateUser, edge cases |

#### Problemas Identificados

1. **Padrão AAA não explícito:** Testes não têm comentários Arrange/Act/Assert
2. **Dados hardcoded:** Teste de logout cria objeto user manualmente ao invés de usar fixtures
3. **Falta teste de updateUser:** Método updateUser não está testado
4. **Falta edge cases:** Não testa casos como token inválido, erro ao decodificar token

#### Ações Necessárias

- [ ] Adicionar comentários AAA (Arrange/Act/Assert) em todos os testes
- [ ] Migrar para usar fixtures.user() ao invés de criar objetos manualmente
- [ ] Adicionar teste para updateUser
- [ ] Adicionar teste para erro ao decodificar token (try/catch no setUserFromToken)
- [ ] Considerar adicionar mais testes para atingir 6+ (acima do mínimo)

#### Conformidade: ⚠️ **PARCIAL (60%)**

---

### 2. components/ProtectedRoute.test.tsx

**Localização:** `web/src/__tests__/unit/components/ProtectedRoute.test.tsx`

#### Estado Atual

**Quantidade de testes:** 4 testes
- ❌ Abaixo do mínimo (4 testes, mínimo é 5)

**Estrutura dos testes:**
```typescript
describe('ProtectedRoute', () => {
  it('deve redirecionar para /login quando não há token', () => { ... })
  it('deve redirecionar para /onboarding/start quando tem token mas não tem branchId', () => { ... })
  it('deve redirecionar para /onboarding/start quando tem token mas não tem role', () => { ... })
  it('deve renderizar children quando há token e usuário com onboarding completo', () => { ... })
})
```

#### Conformidade com Padrão

| Item | Status | Detalhes |
|------|--------|----------|
| Quantidade (min 5) | ❌ | 4 testes (abaixo do mínimo, precisa +1) |
| Padrão AAA | ⚠️ Parcial | Não tem comentários AAA explícitos |
| renderWithProviders | ❌ | Usa MemoryRouter manualmente, não usa renderWithProviders |
| Fixtures | ❌ | Cria objetos user manualmente, não usa fixtures |
| Nomenclatura | ✅ | Todos seguem padrão "deve [comportamento]" |
| Cobertura | ⚠️ | Cobre casos de redirecionamento e render. Falta: loading state, error state, empty state |

#### Problemas Identificados

1. **Quantidade insuficiente:** 4 testes, mínimo é 5
2. **Não usa renderWithProviders:** Usa MemoryRouter manualmente
3. **Não usa fixtures:** Cria objetos user manualmente em cada teste
4. **Padrão AAA não explícito:** Falta comentários Arrange/Act/Assert
5. **Falta cobertura:** Não testa loading/error/empty states (se aplicável)

#### Ações Necessárias

- [ ] Adicionar +1 teste (atingir mínimo 5)
- [ ] Migrar para renderWithProviders
- [ ] Migrar para usar fixtures.user()
- [ ] Adicionar comentários AAA em todos os testes
- [ ] Verificar se precisa testar loading/error/empty states (pode não ser aplicável para ProtectedRoute)

#### Conformidade: ❌ **NÃO CONFORME (40%)**

---

### 3. pages/Login.test.tsx

**Localização:** `web/src/__tests__/unit/pages/Login.test.tsx`

#### Estado Atual

**Quantidade de testes:** 3 testes
- ❌ Abaixo do mínimo (3 testes, mínimo é 5)

**Estrutura dos testes:**
```typescript
describe('Login', () => {
  it('deve redirecionar para /onboarding/start quando login bem-sucedido mas sem onboarding completo', () => { ... })
  it('deve redirecionar para /app/dashboard quando login bem-sucedido e onboarding completo', () => { ... })
  it('deve exibir erro quando credenciais são inválidas', () => { ... })
})
```

#### Conformidade com Padrão

| Item | Status | Detalhes |
|------|--------|----------|
| Quantidade (min 5) | ❌ | 3 testes (abaixo do mínimo, precisa +2) |
| Padrão AAA | ❌ | Não tem comentários AAA explícitos |
| renderWithProviders | ❌ | Usa MemoryRouter manualmente, não usa renderWithProviders |
| Fixtures | ❌ | Cria dados mock manualmente (mockResponse, mockToken), não usa fixtures |
| mockApi | ❌ | Usa vi.mock('@/api/api') diretamente, não usa mockApi helper |
| Nomenclatura | ✅ | Todos seguem padrão "deve [comportamento]" |
| Cobertura | ⚠️ | Cobre: login success (2 casos), error. Falta: render básico, loading state, empty state |

#### Problemas Identificados

1. **Quantidade insuficiente:** 3 testes, mínimo é 5
2. **Não usa renderWithProviders:** Usa MemoryRouter manualmente
3. **Não usa fixtures:** Cria mockResponse e mockToken manualmente
4. **Não usa mockApi helper:** Usa vi.mock diretamente ao invés de mockApi helper
5. **Padrão AAA não explícito:** Falta comentários Arrange/Act/Assert
6. **Falta cobertura:** Não testa render básico, loading state, empty state (campos vazios inicialmente)

#### Ações Necessárias

- [ ] Adicionar +2 testes (atingir mínimo 5)
- [ ] Migrar para renderWithProviders
- [ ] Migrar para usar fixtures (fixtures.user(), fixtures.tokenPayload())
- [ ] Migrar para usar mockApi helper (mockApiResponse, mockApiError)
- [ ] Adicionar comentários AAA em todos os testes
- [ ] Adicionar teste: render básico (campos vazios, botão presente)
- [ ] Adicionar teste: loading state (durante submit)

#### Conformidade: ❌ **NÃO CONFORME (35%)**

---

## 📊 Auditoria de Testes Integration

### 1. integration/auth/login.test.tsx

**Localização:** `web/src/__tests__/integration/auth/login.test.tsx`

#### Estado Atual

**Quantidade de testes:** 5 testes
- ❌ Abaixo do mínimo (5 testes, mínimo é 6)

**Estrutura dos testes:**
```typescript
describe('Login Integration', () => {
  it('deve fazer login com sucesso e redirecionar para dashboard quando onboarding completo', () => { ... })
  it('deve redirecionar para onboarding quando login bem-sucedido mas sem onboarding completo', () => { ... })
  it('deve exibir erro quando credenciais são inválidas', () => { ... })
  it('deve validar campos obrigatórios', () => { ... })
  it('deve exibir loading durante o login', () => { ... })
})
```

#### Conformidade com Padrão

| Item | Status | Detalhes |
|------|--------|----------|
| Quantidade (min 6) | ❌ | 5 testes (abaixo do mínimo, precisa +1) |
| Given/When/Then | ❌ | Não tem comentários Given/When/Then explícitos |
| renderWithProviders | ❌ | Usa MemoryRouter manualmente, não usa renderWithProviders |
| mockApi | ❌ | Usa vi.mock('@/api/api') diretamente, não usa mockApi helper |
| Fixtures | ❌ | Cria dados mock manualmente (mockResponse, mockToken), não usa fixtures |
| Nomenclatura | ✅ | Todos seguem padrão "deve [comportamento]" |
| Cobertura | ⚠️ | Cobre: login success (2 casos), error, validation, loading. Falta: retry, route guard (se aplicável) |

#### Problemas Identificados

1. **Quantidade insuficiente:** 5 testes, mínimo é 6
2. **Falta Given/When/Then:** Não tem comentários estruturados nos testes
3. **Não usa renderWithProviders:** Usa MemoryRouter manualmente
4. **Não usa mockApi helper:** Usa vi.mock diretamente ao invés de mockApi helper
5. **Não usa fixtures:** Cria mockResponse e mockToken manualmente
6. **Falta cobertura:** Falta teste de retry (se aplicável) ou outro caso de integração

#### Ações Necessárias

- [ ] Adicionar +1 teste (atingir mínimo 6) - sugestão: retry após erro, ou teste de navegação após login
- [ ] Adicionar comentários Given/When/Then em TODOS os testes
- [ ] Migrar para renderWithProviders
- [ ] Migrar para mockApi helper (mockApiResponse, mockApiError)
- [ ] Migrar para fixtures (fixtures.user(), fixtures.tokenPayload())
- [ ] Adicionar teste faltante conforme padrão integration

#### Conformidade: ❌ **NÃO CONFORME (40%)**

---

## 📝 Resumo Geral

### Testes Unit - Status

| Arquivo | Quantidade | Padrão AAA | Helpers | Fixtures | Conformidade |
|---------|-----------|------------|---------|----------|--------------|
| authStore.test.ts | ✅ 5 | ⚠️ Parcial | N/A | ⚠️ | ⚠️ 60% |
| ProtectedRoute.test.tsx | ❌ 4 | ⚠️ Parcial | ❌ | ❌ | ❌ 40% |
| Login.test.tsx | ❌ 3 | ❌ | ❌ | ❌ | ❌ 35% |

### Testes Integration - Status

| Arquivo | Quantidade | Given/When/Then | Helpers | Fixtures | Conformidade |
|---------|-----------|-----------------|---------|----------|--------------|
| login.test.tsx | ❌ 5 | ❌ | ❌ | ❌ | ❌ 40% |

---

## 🔄 Próximos Passos

1. ✅ **Concluída:** Auditoria inicial dos testes críticos
2. ⏳ **Próximo:** Auditoria detalhada completa (ler arquivos completos)
3. ⏳ **Depois:** Padronizar stores/authStore.test.ts (começar pelo mais próximo do padrão)
4. ⏳ **Depois:** Padronizar components/ProtectedRoute.test.tsx
5. ⏳ **Depois:** Padronizar pages/Login.test.tsx
6. ⏳ **Depois:** Padronizar integration/auth/login.test.tsx

---

**Última atualização:** 2025-02-01  
**Mantido por:** Equipe de QA  
**Versão:** 1.0  
**Status:** Em Progresso

