# Relatório de Auditoria de Testes: Fluxo de Criação de Conta e Primeiro Acesso

**Data:** 2025-02-01 (Atualizado após refatoração completa)  
**Baseado em:**
- `docs/ai/ACCOUNT_CREATION_FLOW_REPORT.md` (atualizado)
- `docs/ai/ACCOUNT_FLOW_IMPROVEMENT_PLAN.md` (atualizado)

**Objetivo:** Identificar todos os testes existentes que cobrem ou tocam o fluxo de criação de conta e primeiro acesso, mapear gaps de cobertura e recomendar testes mínimos a adicionar.

---

## 📊 Sumário Executivo

### Testes Encontrados

**Backend:**
- ✅ **53 arquivos de teste** (unit, integration, e2e)
- ✅ **Cobertura forte** em: registro, login, criação de igreja, invite links, plan limits
- ⚠️ **Cobertura parcial** em: OnboardingProgress, token com onboardingCompleted
- ❌ **Sem cobertura** em: Endpoints de onboarding progress (`/onboarding/progress`, `/onboarding/complete`)

**Mobile:**
- ⚠️ **6 arquivos de teste** (unit apenas)
- ✅ **Cobertura básica** em: authStore, api client
- ❌ **Sem cobertura** em: screens de onboarding, navigation guards com onboardingCompleted, validação de ownership

**Web:**
- ❌ **Nenhum teste encontrado**

### Gaps Críticos Identificados (Atualizados)

1. **OnboardingProgress** - ❌ Sem teste backend
2. **Guard de navegação com onboardingCompleted** - ❌ Sem teste mobile
3. **Prevenção de duplicação de igreja** - ❌ Sem teste backend
4. **Validação de ownership no frontend** - ❌ Sem teste mobile
5. **Token com onboardingCompleted** - ❌ Sem teste backend
6. **401 interceptor redireciona para Login** - ❌ Sem teste mobile (Item 1.2 pendente)
7. **Limpeza de AsyncStorage no logout** - ❌ Sem teste mobile

---

## 🔍 A) Testes Existentes Encontrados

### Backend Tests

#### 1. Unit Tests

##### `backend/tests/unit/authService.test.ts`
- **O que valida:**
  - `validateCredentials()`: retorna `type: 'member'` quando User tem Member, `type: 'user'` quando não tem
  - `login()`: retorna token com contexto de Member quando User tem Member, sem contexto quando não tem
- **Cobre itens do plano:**
  - ✅ Item 1.1 (parcial): Valida que login retorna token correto baseado em presença de Member
  - ⚠️ **Gap:** Não testa `onboardingCompleted` no token
- **Linhas relevantes:** 32-181

##### `backend/tests/unit/churchService.test.ts`
- **O que valida:**
  - `createChurchWithMainBranch()`: cria igreja, branch, member, permissões
  - Verifica que Member não tem senha (novo modelo)
- **Cobre itens do plano:**
  - ✅ Item 1.1 (parcial): Valida criação de Member durante criação de igreja
  - ⚠️ **Gap:** Não testa prevenção de duplicação via `createdByUserId`
- **Linhas relevantes:** 72-292

##### `backend/tests/unit/planLimits.test.ts`
- **O que valida:**
  - `checkPlanMembersLimit()`: permite criar membro abaixo do limite, lança erro quando excedido
  - Tratamento quando usuário não tem plano (lança erro "Plano não encontrado")
- **Cobre itens do plano:**
  - ✅ Item 1.3: Validação de limite de plano
  - ⚠️ **Gap:** Não testa busca por `code` (ainda usa `name`)
- **Linhas relevantes:** 21-303

#### 2. Integration Tests

##### `backend/tests/integration/churchCreation.test.ts`
- **O que valida:**
  - `POST /churches`: cria igreja e Member associado ao User, retorna token atualizado com contexto de Member
  - **Importante:** Testa que token retornado contém `memberId`, `role`, `branchId`, `churchId`
- **Cobre itens do plano:**
  - ✅ Item 0.1 (parcial): Valida que `POST /churches` retorna token atualizado
  - ⚠️ **Gap:** Não testa prevenção de duplicação (retornar igreja existente)
  - ⚠️ **Gap:** Não testa `onboardingCompleted` no token
- **Linhas relevantes:** 19-163

##### `backend/tests/integration/onboardingRoutes.test.ts`
- **O que valida:**
  - `POST /register`: registro público cria usuário e retorna token
  - `POST /churches`: cria igreja com filial principal, cria membro administrador
  - Fluxo completo: registro → igreja
- **Cobre itens do plano:**
  - ✅ Item 1.1 (parcial): Valida fluxo completo de onboarding
  - ⚠️ **Gap:** Não testa endpoints de onboarding progress (`/onboarding/progress`, `/onboarding/complete`)
- **Linhas relevantes:** 20-456

### Mobile Tests

#### 1. Unit Tests

##### `mobile/src/__tests__/unit/stores/authStore.test.ts`
- **O que valida:**
  - `setUserFromToken()`: decodifica token e define usuário corretamente, mapeia permissões
  - `logout()`: limpa usuário e token
- **Cobre itens do plano:**
  - ✅ Item 0.1 (parcial): Valida que `setUserFromToken` funciona corretamente
  - ⚠️ **Gap:** Não testa `onboardingCompleted` no token
  - ⚠️ **Gap:** Não testa limpeza de AsyncStorage no logout
- **Linhas relevantes:** 16-112

---

## 🆕 B) Novos Gaps Identificados (Após Refatoração)

### Backend

#### 1. OnboardingProgress Service
- ❌ **Sem teste:** `OnboardingProgressService.getOrCreateProgress()`
- ❌ **Sem teste:** `OnboardingProgressService.markStepComplete()`
- ❌ **Sem teste:** `OnboardingProgressService.markComplete()`
- ❌ **Sem teste:** `OnboardingProgressService.isCompleted()`

#### 2. Onboarding Controller
- ❌ **Sem teste:** `GET /onboarding/progress`
- ❌ **Sem teste:** `POST /onboarding/progress/:step`
- ❌ **Sem teste:** `POST /onboarding/complete` (retorna token atualizado)

#### 3. Church Controller - Prevenção de Duplicação
- ❌ **Sem teste:** Retornar igreja existente quando `createdByUserId` já existe
- ❌ **Sem teste:** Criar Branch/Member se não existirem ao retornar igreja existente

#### 4. Token com onboardingCompleted
- ❌ **Sem teste:** Token inclui `onboardingCompleted` após login
- ❌ **Sem teste:** Token inclui `onboardingCompleted` após criar igreja
- ❌ **Sem teste:** Token atualizado com `onboardingCompleted = true` após completar onboarding

### Mobile

#### 1. AppNavigator - Guard com onboardingCompleted
- ❌ **Sem teste:** Bloqueia acesso a Main sem `onboardingCompleted = true`
- ❌ **Sem teste:** Permite acesso a Main com `onboardingCompleted = true`
- ❌ **Sem teste:** Transição automática após token atualizado

#### 2. Onboarding Screens
- ❌ **Sem teste:** `StartScreen` - Verifica estado e prefill
- ❌ **Sem teste:** `ChurchScreen` - Validação de ownership antes de prefill
- ❌ **Sem teste:** `ChurchScreen` - Marca progresso após criar/atualizar igreja
- ❌ **Sem teste:** `BranchesScreen` - Marca progresso após salvar filiais
- ❌ **Sem teste:** `SettingsScreen` - Marca progresso após finalizar
- ❌ **Sem teste:** `ConcluidoScreen` - Marca onboarding completo e atualiza token

#### 3. AuthStore - Limpeza de AsyncStorage
- ❌ **Sem teste:** `logout()` limpa dados de onboarding do AsyncStorage

---

## 📊 Matriz de Cobertura por Item do Plano (Atualizada)

| Item | Backend Tests | Mobile Tests | E2E Tests | Status |
|------|---------------|--------------|-----------|--------|
| **0.1** Token update after church creation | ✅ Parcial | ✅ Implementado | ❌ Ausente | 🟡 Gap (E2E) |
| **0.2** Guard global de navegação | ❌ N/A | ❌ Ausente | ❌ Ausente | 🔴 Gap |
| **0.3** Remove client-side invite validation | ✅ Coberto | ❌ N/A | ❌ N/A | ✅ OK (descartado) |
| **1.1** Onboarding obrigatório | ⚠️ Parcial | ❌ Ausente | ❌ Ausente | 🔴 Gap |
| **1.2** 401 redirects to Login | ❌ N/A | ❌ Ausente | ❌ Ausente | 🔴 Gap |
| **1.3** Plan validation com code | ⚠️ Parcial | ❌ N/A | ❌ Ausente | 🟡 Gap |
| **1.4** Checklist pré-deploy | ❌ N/A | ❌ N/A | ❌ N/A | ⏳ Pendente |
| **2.1** Refresh token | ❌ Ausente | ❌ Ausente | ❌ Ausente | 🟢 Não priorizado |
| **2.2** AsyncStorage cleanup | ❌ N/A | ❌ Ausente | ❌ Ausente | 🔴 Gap |
| **3.1** SettingsOnboarding completo | ❌ N/A | ❌ N/A | ❌ N/A | ✅ OK (descartado) |
| **3.2** Logging/Observability | ❌ Ausente | ❌ Ausente | ❌ Ausente | 🟢 Não priorizado |
| **🆕** OnboardingProgress | ❌ Ausente | ❌ Ausente | ❌ Ausente | 🔴 Gap |
| **🆕** Prevenção duplicação igreja | ❌ Ausente | ❌ Ausente | ❌ Ausente | 🔴 Gap |
| **🆕** Validação ownership frontend | ❌ N/A | ❌ Ausente | ❌ Ausente | 🔴 Gap |

**Legenda:**
- ✅ Coberto: Testes existem e cobrem o item
- ⚠️ Parcial: Testes existem mas não cobrem completamente
- ❌ Ausente: Nenhum teste encontrado
- 🔴 Gap: Gap crítico que deve ser fechado
- 🟡 Gap: Gap importante que deve ser fechado
- 🟢 Não priorizado: Item não é crítico para MVP
- ⏳ Pendente: Item ainda não implementado

---

## 🎯 Priorização de Testes a Adicionar (Atualizada)

### Prioridade 1 (Crítico - Implementar Imediatamente)

#### Backend

1. **OnboardingProgress Service (Unit)**
   - `getOrCreateProgress()` - Cria se não existe, retorna se existe
   - `markStepComplete()` - Marca etapa específica como completa
   - `markComplete()` - Marca onboarding como completo
   - `isCompleted()` - Retorna status de conclusão

2. **Onboarding Controller (Integration)**
   - `GET /onboarding/progress` - Retorna progresso atual
   - `POST /onboarding/progress/:step` - Marca etapa como completa
   - `POST /onboarding/complete` - Marca completo e retorna token atualizado

3. **Church Controller - Prevenção de Duplicação (Integration)**
   - `POST /churches` retorna igreja existente quando `createdByUserId` já existe
   - Cria Branch/Member se não existirem ao retornar igreja existente
   - Token retornado inclui `onboardingCompleted`

4. **Token com onboardingCompleted (Integration)**
   - Login inclui `onboardingCompleted` no token
   - Criação de igreja inclui `onboardingCompleted` no token
   - Completar onboarding atualiza token com `onboardingCompleted = true`

#### Mobile

5. **AppNavigator - Guard com onboardingCompleted (Integration/E2E)**
   - Bloqueia acesso a Main sem `onboardingCompleted = true`
   - Permite acesso a Main com `onboardingCompleted = true`
   - Transição automática após token atualizado

6. **ChurchScreen - Validação de Ownership (Unit/Integration)**
   - Valida ownership antes de usar dados de AsyncStorage
   - Limpa AsyncStorage se igreja não pertence ao usuário

7. **AuthStore - Limpeza AsyncStorage (Unit)**
   - `logout()` limpa todos os dados de onboarding

### Prioridade 2 (Importante - Implementar em Seguida)

8. **Onboarding Screens - Marcação de Progresso (Integration)**
   - `ChurchScreen` marca progresso após criar/atualizar igreja
   - `BranchesScreen` marca progresso após salvar filiais
   - `SettingsScreen` marca progresso após finalizar
   - `ConcluidoScreen` marca completo e atualiza token

9. **StartScreen - Verificação de Estado (Integration)**
   - Verifica estado via `GET /onboarding/state`
   - Preenche dados se `PENDING`
   - Navega corretamente baseado no estado

### Prioridade 3 (Desejável - Implementar Após Prioridades 1 e 2)

10. **E2E - Fluxo Completo de Onboarding**
    - Registro → Onboarding → Acesso ao App
    - Resumo de onboarding (PENDING)
    - Prevenção de duplicação

11. **401 Interceptor (Item 1.2 pendente)**
    - Redireciona para Login em 401
    - Limpa stack de navegação

---

## 📝 Testes Recomendados a Adicionar

### Backend - Unit Tests

#### 1. `backend/tests/unit/onboardingProgressService.test.ts` - Criar
```typescript
describe('OnboardingProgressService', () => {
  it('deve criar progresso se não existe', async () => {
    const progress = await service.getOrCreateProgress('user-1')
    expect(progress.userId).toBe('user-1')
    expect(progress.churchConfigured).toBe(false)
  })
  
  it('deve retornar progresso existente', async () => {
    await service.getOrCreateProgress('user-1')
    const progress = await service.getOrCreateProgress('user-1')
    expect(progress).toBeDefined()
  })
  
  it('deve marcar etapa church como completa', async () => {
    await service.markStepComplete('user-1', 'church')
    const progress = await service.getProgress('user-1')
    expect(progress?.churchConfigured).toBe(true)
  })
  
  it('deve marcar onboarding como completo', async () => {
    await service.markComplete('user-1')
    const progress = await service.getProgress('user-1')
    expect(progress?.completed).toBe(true)
    expect(progress?.completedAt).toBeDefined()
  })
  
  it('deve retornar false se onboarding não completo', async () => {
    const completed = await service.isCompleted('user-1')
    expect(completed).toBe(false)
  })
})
```
**Cobre:** OnboardingProgress Service

#### 2. `backend/tests/unit/churchService.test.ts` - Atualizar
```typescript
describe('ChurchService - Prevenção de Duplicação', () => {
  it('deve retornar igreja existente quando createdByUserId já existe', async () => {
    // Criar primeira igreja
    const church1 = await service.createChurchWithMainBranch({ name: 'Igreja 1' }, user)
    
    // Tentar criar segunda igreja
    const result = await controller.create(request, reply)
    
    // Deve retornar igreja existente (não criar nova)
    expect(result.church.id).toBe(church1.id)
  })
})
```
**Cobre:** Prevenção de duplicação

### Backend - Integration Tests

#### 3. `backend/tests/integration/onboardingProgress.test.ts` - Criar
```typescript
describe('Onboarding Progress Endpoints', () => {
  it('GET /onboarding/progress deve retornar progresso atual', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/onboarding/progress',
      headers: { authorization: `Bearer ${token}` }
    })
    
    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('churchConfigured')
    expect(response.json()).toHaveProperty('branchesConfigured')
    expect(response.json()).toHaveProperty('settingsConfigured')
    expect(response.json()).toHaveProperty('completed')
  })
  
  it('POST /onboarding/progress/church deve marcar etapa como completa', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/onboarding/progress/church',
      headers: { authorization: `Bearer ${token}` }
    })
    
    expect(response.statusCode).toBe(200)
    
    // Verificar que foi marcado
    const progress = await app.inject({
      method: 'GET',
      url: '/onboarding/progress',
      headers: { authorization: `Bearer ${token}` }
    })
    
    expect(progress.json().churchConfigured).toBe(true)
  })
  
  it('POST /onboarding/complete deve marcar completo e retornar token', async () => {
    // Marcar todas as etapas primeiro
    await app.inject({ method: 'POST', url: '/onboarding/progress/church', headers: { authorization: `Bearer ${token}` } })
    await app.inject({ method: 'POST', url: '/onboarding/progress/branches', headers: { authorization: `Bearer ${token}` } })
    await app.inject({ method: 'POST', url: '/onboarding/progress/settings', headers: { authorization: `Bearer ${token}` } })
    
    const response = await app.inject({
      method: 'POST',
      url: '/onboarding/complete',
      headers: { authorization: `Bearer ${token}` }
    })
    
    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('token')
    expect(response.json().completed).toBe(true)
    
    // Verificar que token inclui onboardingCompleted = true
    const decoded = jwtDecode(response.json().token)
    expect(decoded.onboardingCompleted).toBe(true)
  })
})
```
**Cobre:** Endpoints de onboarding progress

#### 4. `backend/tests/integration/churchCreation.test.ts` - Atualizar
```typescript
describe('Church Creation - Prevenção de Duplicação', () => {
  it('deve retornar igreja existente quando createdByUserId já existe', async () => {
    // Criar primeira igreja
    const response1 = await app.inject({
      method: 'POST',
      url: '/churches',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Igreja Teste' }
    })
    
    const churchId1 = response1.json().church.id
    
    // Tentar criar segunda igreja (mesmo usuário)
    const response2 = await app.inject({
      method: 'POST',
      url: '/churches',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Igreja Teste 2' }
    })
    
    // Deve retornar igreja existente (200 OK, não 201 Created)
    expect(response2.statusCode).toBe(200)
    expect(response2.json().church.id).toBe(churchId1)
  })
  
  it('deve criar Branch/Member se não existirem ao retornar igreja existente', async () => {
    // Criar igreja sem Branch/Member (simular estado antigo)
    // ...
    
    // Tentar criar novamente
    const response = await app.inject({
      method: 'POST',
      url: '/churches',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Igreja Teste' }
    })
    
    // Deve criar Branch/Member automaticamente
    expect(response.json().branch).toBeDefined()
    expect(response.json().member).toBeDefined()
  })
})
```
**Cobre:** Prevenção de duplicação

#### 5. `backend/tests/integration/authRoutes.test.ts` - Atualizar
```typescript
describe('Login - Token com onboardingCompleted', () => {
  it('deve incluir onboardingCompleted no token após login', async () => {
    // Criar usuário e marcar onboarding como completo
    await progressService.markComplete(userId)
    
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@example.com', password: 'password' }
    })
    
    const token = response.json().token
    const decoded = jwtDecode(token)
    
    expect(decoded.onboardingCompleted).toBe(true)
  })
  
  it('deve incluir onboardingCompleted = false se onboarding não completo', async () => {
    // Criar usuário sem completar onboarding
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@example.com', password: 'password' }
    })
    
    const token = response.json().token
    const decoded = jwtDecode(token)
    
    expect(decoded.onboardingCompleted).toBe(false)
  })
})
```
**Cobre:** Token com onboardingCompleted

### Mobile - Unit Tests

#### 6. `mobile/src/__tests__/unit/stores/authStore.test.ts` - Atualizar
```typescript
describe('AuthStore - onboardingCompleted', () => {
  it('deve extrair onboardingCompleted do token', () => {
    const token = generateToken({ onboardingCompleted: true })
    setUserFromToken(token)
    
    const user = useAuthStore.getState().user
    expect(user?.onboardingCompleted).toBe(true)
  })
  
  it('deve limpar AsyncStorage no logout', async () => {
    // Preencher AsyncStorage com dados de onboarding
    await AsyncStorage.setItem('onboarding_church_id', 'church-1')
    await AsyncStorage.setItem('onboarding_structure', 'branches')
    
    // Fazer logout
    logout()
    
    // Verificar que dados foram limpos
    const churchId = await AsyncStorage.getItem('onboarding_church_id')
    const structure = await AsyncStorage.getItem('onboarding_structure')
    
    expect(churchId).toBeNull()
    expect(structure).toBeNull()
  })
})
```
**Cobre:** onboardingCompleted no token, limpeza AsyncStorage

### Mobile - Integration Tests

#### 7. `mobile/src/__tests__/integration/navigation/AppNavigator.test.tsx` - Criar
```typescript
describe('AppNavigator - Guard com onboardingCompleted', () => {
  it('deve bloquear acesso a Main sem onboardingCompleted', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        memberId: 'member-1',
        branchId: 'branch-1',
        role: 'ADMINGERAL',
        onboardingCompleted: false // Onboarding não completo
      }
    })
    
    const { getByTestId } = render(<AppNavigator />)
    
    // Deve renderizar Onboarding Navigator, não Main Navigator
    expect(getByTestId('onboarding-navigator')).toBeDefined()
    expect(() => getByTestId('main-navigator')).toThrow()
  })
  
  it('deve permitir acesso a Main com onboardingCompleted = true', () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        memberId: 'member-1',
        branchId: 'branch-1',
        role: 'ADMINGERAL',
        onboardingCompleted: true // Onboarding completo
      }
    })
    
    const { getByTestId } = render(<AppNavigator />)
    
    // Deve renderizar Main Navigator
    expect(getByTestId('main-navigator')).toBeDefined()
  })
  
  it('deve transicionar automaticamente após token atualizado', async () => {
    // Estado inicial: onboarding não completo
    useAuthStore.setState({
      user: { onboardingCompleted: false }
    })
    
    const { getByTestId, rerender } = render(<AppNavigator />)
    expect(getByTestId('onboarding-navigator')).toBeDefined()
    
    // Atualizar token com onboardingCompleted = true
    const newToken = generateToken({ onboardingCompleted: true })
    setUserFromToken(newToken)
    
    // Re-renderizar
    rerender(<AppNavigator />)
    
    // Deve transicionar para Main Navigator
    expect(getByTestId('main-navigator')).toBeDefined()
  })
})
```
**Cobre:** Guard com onboardingCompleted, transição automática

#### 8. `mobile/src/__tests__/integration/screens/ChurchScreen.test.tsx` - Criar
```typescript
describe('ChurchScreen - Validação de Ownership', () => {
  it('deve validar ownership antes de usar dados de AsyncStorage', async () => {
    // Simular AsyncStorage com dados de outra igreja
    await AsyncStorage.setItem('onboarding_church_id', 'other-church-id')
    
    // Mock: GET /churches retorna array vazio (igreja não pertence ao usuário)
    api.get.mockResolvedValueOnce({ data: [] })
    
    render(<ChurchScreen />)
    
    // Verificar que AsyncStorage foi limpo
    await waitFor(async () => {
      const churchId = await AsyncStorage.getItem('onboarding_church_id')
      expect(churchId).toBeNull()
    })
  })
  
  it('deve marcar progresso após criar igreja', async () => {
    // Mock: POST /churches retorna sucesso
    api.post.mockResolvedValueOnce({
      data: { church: { id: 'church-1' }, token: 'new-token' }
    })
    
    // Mock: POST /onboarding/progress/church
    api.post.mockResolvedValueOnce({ data: { message: 'Etapa marcada' } })
    
    const { getByText } = render(<ChurchScreen />)
    fireEvent.press(getByText('Salvar'))
    
    // Verificar que progresso foi marcado
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/onboarding/progress/church')
    })
  })
})
```
**Cobre:** Validação de ownership, marcação de progresso

### E2E Tests

#### 9. `mobile/src/__tests__/e2e/onboarding-flow.test.ts` - Criar
```typescript
describe('E2E: Onboarding Flow Completo', () => {
  it('deve completar fluxo: registro → onboarding → acesso ao app', async () => {
    // 1. Registrar
    await element(by.id('register-button')).tap()
    await element(by.id('email-input')).typeText('test@example.com')
    await element(by.id('password-input')).typeText('password123')
    await element(by.id('submit-button')).tap()
    
    // 2. Onboarding
    await element(by.id('structure-simple')).tap()
    await element(by.id('continue-button')).tap()
    
    await element(by.id('church-name-input')).typeText('Igreja Teste')
    await element(by.id('save-button')).tap()
    
    await element(by.id('settings-continue')).tap()
    await element(by.id('settings-continue')).tap()
    await element(by.id('settings-continue')).tap()
    
    await element(by.id('complete-button')).tap()
    
    // 3. Verificar acesso ao app
    await expect(element(by.id('dashboard-screen'))).toBeVisible()
  })
  
  it('deve resumir onboarding se PENDING', async () => {
    // 1. Criar conta e iniciar onboarding
    // 2. Criar igreja mas não completar
    // 3. Fazer logout e login
    // 4. Verificar que dados são prefilled
    // 5. Completar onboarding
  })
  
  it('deve prevenir duplicação de igreja', async () => {
    // 1. Criar igreja
    // 2. Tentar criar igreja novamente
    // 3. Verificar que retorna igreja existente (não cria duplicata)
  })
})
```
**Cobre:** Fluxo completo, resumo, prevenção de duplicação

---

## 🔒 C) Account Flow Invariants (Must Never Break)

Esta seção documenta invariantes críticos do sistema que **NUNCA** devem ser violados. Estes invariantes devem ser usados como:
- Critérios de aceitação para testes
- Checklist de regressão
- Validação em code reviews

### Invariantes de Segurança

#### INV-1: Isolamento Multi-Tenancy
**Descrição:** Um usuário nunca pode acessar dados de outro tenant (igreja).

**Enforcement:**
- Backend: `GET /churches` retorna apenas igreja do usuário (via `createdByUserId` ou `Member.Branch.Church`)
- Frontend: Valida ownership antes de usar dados de `AsyncStorage`

**Onde testar:**
- Backend Integration: `churchController.getAll()` retorna apenas igreja do usuário
- Mobile Integration: `ChurchScreen` valida ownership antes de prefill
- E2E: Usuário A não vê dados de Usuário B

**Violação:** 🔴 **CRÍTICO** - Vazamento de dados entre tenants

---

#### INV-2: Prevenção de Duplicação de Igreja
**Descrição:** Um usuário nunca pode ter mais de uma igreja "pending" criada por ele.

**Enforcement:**
- Backend: `POST /churches` verifica `createdByUserId` antes de criar
- Se igreja existe, retorna existente (200 OK) ao invés de criar nova (201 Created)

**Onde testar:**
- Backend Integration: `churchController.create()` retorna igreja existente quando `createdByUserId` já existe
- E2E: Tentar criar segunda igreja retorna primeira

**Violação:** 🟡 **ALTO** - Dados inconsistentes, possível violação de limites de plano

---

#### INV-3: Validação de Ownership
**Descrição:** Dados de prefill devem sempre validar ownership antes de uso.

**Enforcement:**
- Frontend: `ChurchScreen` valida via `GET /churches` antes de usar `AsyncStorage`
- Se igreja não pertence ao usuário, limpa `AsyncStorage`

**Onde testar:**
- Mobile Integration: `ChurchScreen` limpa `AsyncStorage` se igreja não pertence ao usuário
- E2E: Dados de outro usuário não aparecem após logout/login

**Violação:** 🔴 **CRÍTICO** - Vazamento de dados entre tenants

---

### Invariantes de Estado

#### INV-4: Onboarding Obrigatório
**Descrição:** Usuário não pode acessar Main App sem `onboardingCompleted = true` no token.

**Enforcement:**
- `AppNavigator` verifica `onboardingCompleted` além de `hasCompleteMember`
- `OnboardingProgress.completed` só é `true` quando usuário finaliza explicitamente

**Onde testar:**
- Mobile Integration: `AppNavigator` bloqueia acesso sem `onboardingCompleted`
- E2E: Tentar acessar Main sem completar onboarding redireciona para onboarding

**Violação:** 🔴 **CRÍTICO** - Usuário acessa app sem configurar igreja

---

#### INV-5: Member Completo para Acesso
**Descrição:** Usuário sem `memberId`, `branchId` ou `role` não pode acessar Main App.

**Enforcement:**
- `AppNavigator` verifica `hasCompleteMember = user?.memberId && user?.branchId && user?.role`
- Guard global previne acesso sem Member completo

**Onde testar:**
- Mobile Integration: `AppNavigator` bloqueia acesso sem Member completo
- E2E: Tentar acessar Main sem Member redireciona para onboarding

**Violação:** 🔴 **CRÍTICO** - Erros 404 em funcionalidades que requerem Member

---

#### INV-6: Token Atualizado Após Mudanças de Contexto
**Descrição:** Token deve ser atualizado sempre que Member/Branch/Onboarding muda.

**Enforcement:**
- Backend sempre retorna token atualizado após criar/atualizar igreja
- Backend sempre retorna token atualizado após completar onboarding
- Frontend sempre atualiza store quando recebe token do backend

**Onde testar:**
- Backend Integration: `POST /churches` retorna token com `memberId`, `branchId`, `role`
- Backend Integration: `POST /onboarding/complete` retorna token com `onboardingCompleted = true`
- Mobile Integration: `ChurchScreen` atualiza token após criar igreja
- E2E: Token contém dados corretos após cada etapa

**Violação:** 🟡 **ALTO** - Estado inconsistente, navegação quebrada

---

### Invariantes de Dados

#### INV-7: Limpeza de AsyncStorage no Logout
**Descrição:** Todos os dados de onboarding devem ser limpos do `AsyncStorage` no logout.

**Enforcement:**
- `authStore.logout()` limpa todas as chaves de onboarding
- Previne vazamento de dados entre usuários

**Onde testar:**
- Mobile Unit: `authStore.logout()` limpa todas as chaves
- E2E: Dados não aparecem após logout/login com outro usuário

**Violação:** 🔴 **CRÍTICO** - Vazamento de dados entre usuários

---

#### INV-8: Branch Sempre Criada com Igreja
**Descrição:** Toda igreja criada deve ter pelo menos uma Branch (principal).

**Enforcement:**
- `churchService.createChurchWithMainBranch()` sempre cria Branch principal
- Member requer Branch (FK obrigatória)

**Onde testar:**
- Backend Unit: `createChurchWithMainBranch()` sempre cria Branch
- Backend Integration: `POST /churches` retorna Branch criada

**Violação:** 🟡 **ALTO** - Inconsistência de dados, Member não pode ser criado

---

#### INV-9: Member Sempre Criado com Igreja
**Descrição:** Toda igreja criada deve ter Member associado ao criador.

**Enforcement:**
- `churchService.createChurchWithMainBranch()` sempre cria Member (ADMINGERAL)
- Se Member não existe ao retornar igreja existente, cria automaticamente

**Onde testar:**
- Backend Unit: `createChurchWithMainBranch()` sempre cria Member
- Backend Integration: `POST /churches` retorna Member criado
- Backend Integration: Retornar igreja existente cria Member se não existe

**Violação:** 🟡 **ALTO** - Usuário não pode usar app sem Member

---

#### INV-10: OnboardingProgress Criado Automaticamente
**Descrição:** `OnboardingProgress` é criado automaticamente quando necessário.

**Enforcement:**
- `OnboardingProgressService.getOrCreateProgress()` cria se não existe
- Endpoints de onboarding sempre criam progresso se necessário

**Onde testar:**
- Backend Unit: `getOrCreateProgress()` cria se não existe
- Backend Integration: Endpoints criam progresso automaticamente

**Violação:** 🟢 **BAIXO** - Apenas UX (progresso não rastreado)

---

### Invariantes de Navegação

#### INV-11: Transição Automática Após Mudança de Estado
**Descrição:** `AppNavigator` deve transicionar automaticamente quando estado muda, sem navegação manual.

**Enforcement:**
- Nenhuma tela faz `navigation.reset()` ou `navigation.navigate('Main')` manualmente
- `AppNavigator` re-renderiza quando `authStore.user` muda
- Transições são automáticas baseadas em estado

**Onde testar:**
- Mobile Integration: Nenhuma tela faz navegação manual para Main
- E2E: Transições são automáticas após atualizar token

**Violação:** 🟡 **ALTO** - Erros de navegação, UX ruim

---

#### INV-12: Login Sempre Mostra Tela Correta
**Descrição:** Após login, usuário deve ver Login, Onboarding ou Main baseado em estado.

**Enforcement:**
- `AppNavigator` verifica `isAuthenticated()`, `hasCompleteMember`, `onboardingCompleted`
- Renderiza navigator correto baseado em estado

**Onde testar:**
- Mobile Integration: Login mostra tela correta baseado em estado
- E2E: Fluxo completo de login funciona corretamente

**Violação:** 🔴 **CRÍTICO** - Usuário preso ou vê tela errada

---

### Mapeamento: Invariante → Onde Testar

| Invariante | Unit | Integration | E2E | Prioridade |
|------------|------|-------------|-----|------------|
| INV-1: Isolamento Multi-Tenancy | ❌ | ✅ Backend + Mobile | ✅ | 🔴 Crítico |
| INV-2: Prevenção Duplicação | ❌ | ✅ Backend | ✅ | 🟡 Alto |
| INV-3: Validação Ownership | ❌ | ✅ Mobile | ✅ | 🔴 Crítico |
| INV-4: Onboarding Obrigatório | ❌ | ✅ Mobile | ✅ | 🔴 Crítico |
| INV-5: Member Completo | ❌ | ✅ Mobile | ✅ | 🔴 Crítico |
| INV-6: Token Atualizado | ❌ | ✅ Backend + Mobile | ✅ | 🟡 Alto |
| INV-7: Limpeza AsyncStorage | ✅ Mobile | ❌ | ✅ | 🔴 Crítico |
| INV-8: Branch Sempre Criada | ✅ Backend | ✅ Backend | ❌ | 🟡 Alto |
| INV-9: Member Sempre Criado | ✅ Backend | ✅ Backend | ❌ | 🟡 Alto |
| INV-10: OnboardingProgress Criado | ✅ Backend | ✅ Backend | ❌ | 🟢 Baixo |
| INV-11: Transição Automática | ❌ | ✅ Mobile | ✅ | 🟡 Alto |
| INV-12: Login Mostra Tela Correta | ❌ | ✅ Mobile | ✅ | 🔴 Crítico |

**Legenda:**
- ✅ Deve ser testado
- ❌ Não necessário ou não aplicável
- 🔴 Crítico: Deve ser testado antes de deploy
- 🟡 Alto: Deve ser testado em breve
- 🟢 Baixo: Pode ser testado depois

---

## 📝 Notas Finais

### Pontos Fortes
1. ✅ Backend tem cobertura forte em registro, login, criação de igreja, invite links
2. ✅ Testes de expiração de invite link (end-of-day) estão implementados
3. ✅ Testes de validação de limite de plano estão implementados
4. ✅ E2E tests cobrem fluxo completo de registro até uso do app

### Pontos de Atenção
1. ⚠️ **OnboardingProgress** não tem testes (novo sistema)
2. ⚠️ **Prevenção de duplicação** não tem testes
3. ⚠️ **Guard com onboardingCompleted** não tem testes mobile
4. ⚠️ **Validação de ownership** não tem testes mobile
5. ⚠️ Mobile tem poucos testes (apenas 6 arquivos, todos unit)
6. ⚠️ Nenhum teste de screens críticas de onboarding

### Recomendações Prioritárias
1. **URGENTE:** Adicionar testes de OnboardingProgress (backend unit + integration)
2. **URGENTE:** Adicionar testes de prevenção de duplicação (backend integration)
3. **ALTA:** Adicionar testes de guard com onboardingCompleted (mobile integration/E2E)
4. **ALTA:** Adicionar testes de validação de ownership (mobile integration)
5. **MÉDIA:** Adicionar testes de limpeza AsyncStorage (mobile unit)
6. **BAIXA:** Adicionar testes de screens de onboarding (mobile integration)

---

**Fim do Relatório de Auditoria de Testes (Atualizado)**
